import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { supabase } from '../../utils/supabaseClient'; // Ensure this points to your client

export default function AdminSupportScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // ==========================================
  // 1. FETCH & LISTEN TO CONVERSATIONS
  // ==========================================
  useEffect(() => {
    fetchConversations();

    // Listen for new conversations opening
    const convSubscription = supabase
      .channel('admin_conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations() // Reload list on any change
      )
      .subscribe();

    return () => {
      supabase.removeChannel(convSubscription);
    };
  }, []);

  const fetchConversations = async () => {
    // Note: fetching phone instead of account_number based on your NEW schema
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        user:users (username, phone) 
      `)
      .eq('status', 'open') // Only show open tickets
      .order('created_at', { ascending: false });

    if (error) console.error('Error fetching chats:', error);
    else setConversations(data || []);
  };

  // ==========================================
  // 2. FETCH & LISTEN TO MESSAGES
  // ==========================================
  useEffect(() => {
    if (!selectedConvId) return;

    fetchMessages(selectedConvId);

    // Realtime listener for the selected chat
    const msgSubscription = supabase
      .channel(`admin_chat:${selectedConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConvId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgSubscription);
    };
  }, [selectedConvId]);

  const fetchMessages = async (convId: number) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });

    if (!error) setMessages(data || []);
    setLoading(false);
  };

  // ==========================================
  // 3. ACTIONS (REPLY & CLOSE)
  // ==========================================
  const sendReply = async () => {
    if (!reply.trim() || !selectedConvId) return;

    const text = reply.trim();
    setReply(''); // Clear UI immediately

    const { error } = await supabase.from('messages').insert([
      {
        conversation_id: selectedConvId,
        sender_id: null, // Admin ID is null in your schema logic
        sender_type: 'admin',
        message_text: text,
      },
    ]);

    if (error) {
      Alert.alert('Error', 'Failed to send reply');
      setReply(text); // Restore text on fail
    }
  };

  const closeConversation = async () => {
    if (!selectedConvId) return;

    // Call the SQL function we created
    const { error } = await supabase.rpc('close_conversation', {
      conv_id: selectedConvId,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Cleanup UI
      setMessages([]);
      setSelectedConvId(null);
      fetchConversations(); // Refresh list
    }
  };

  // ==========================================
  // 4. RENDER HELPERS
  // ==========================================
  const renderConversationItem = ({ item }: any) => (
    <TouchableOpacity
      style={[
        styles.convItem,
        selectedConvId === item.id && styles.convItemSelected,
      ]}
      onPress={() => setSelectedConvId(item.id)}
    >
      <View style={styles.convHeader}>
        <Text style={styles.convUser}>
          {item.user?.username || 'Unknown User'}
        </Text>
        <Text style={styles.convTime}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.convDetails}>
        Phone: {item.user?.phone || 'N/A'}
      </Text>
      <View style={styles.statusBadge}>
        <Text style={styles.statusText}>{item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMessageItem = ({ item }: any) => {
    const isAdmin = item.sender_type === 'admin';
    return (
      <View
        style={[
          styles.msgBubble,
          isAdmin ? styles.msgBubbleAdmin : styles.msgBubbleUser,
        ]}
      >
        <Text style={[styles.msgText, isAdmin ? styles.msgTextAdmin : null]}>
          {item.message_text}
        </Text>
        <Text style={styles.msgTime}>
          {new Date(item.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* LEFT PANEL: CONVERSATION LIST */}
      <View style={styles.leftPanel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Tickets</Text>
        </View>
        <FlatList
          data={conversations}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderConversationItem}
          contentContainerStyle={{ padding: 10 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No open tickets</Text>
          }
        />
      </View>

      {/* RIGHT PANEL: CHAT WINDOW */}
      <View style={styles.rightPanel}>
        {selectedConvId ? (
          <>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatTitle}>
                Chat #{selectedConvId}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeConversation}
              >
                <Text style={styles.closeButtonText}>Close Ticket</Text>
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <View style={styles.chatBody}>
              {loading ? (
                <ActivityIndicator size="large" color="#007bff" />
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderMessageItem}
                  contentContainerStyle={{ padding: 20 }}
                  onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                  }
                />
              )}
            </View>

            {/* Input Area */}
            <View style={styles.inputArea}>
              <TextInput
                style={styles.input}
                value={reply}
                onChangeText={setReply}
                placeholder="Type a reply..."
                placeholderTextColor="#999"
                onSubmitEditing={sendReply}
              />
              <TouchableOpacity style={styles.sendButton} onPress={sendReply}>
                <Text style={styles.sendButtonText}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              Select a conversation to start chatting
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ==========================================
// 5. STYLES (Desktop Optimized)
// ==========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row', // Split view for desktop
    backgroundColor: '#f5f7fa',
  },
  // --- Left Panel ---
  leftPanel: {
    width: 300,
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: '#e1e4e8',
  },
  panelHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
    backgroundColor: '#f8f9fa',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  convItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  convItemSelected: {
    backgroundColor: '#e6f7ff', // Light blue selection
    borderLeftWidth: 4,
    borderLeftColor: '#007bff',
  },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  convUser: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  convTime: {
    fontSize: 12,
    color: '#999',
  },
  convDetails: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#d1f7c4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#2e7d32',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
  },

  // --- Right Panel ---
  rightPanel: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#f0f2f5',
  },
  chatHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e4e8',
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    backgroundColor: '#ff4d4f',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  closeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  chatBody: {
    flex: 1,
  },
  msgBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  msgBubbleUser: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e1e4e8',
  },
  msgBubbleAdmin: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
  },
  msgText: {
    fontSize: 14,
    color: '#333',
  },
  msgTextAdmin: {
    color: '#fff',
  },
  msgTime: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  
  // --- Input Area ---
  inputArea: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e1e4e8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f7fa',
    borderRadius: 20,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#e1e4e8',
    marginRight: 10,
    color: '#333',
  },
  sendButton: {
    backgroundColor: '#007bff',
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
  },
});