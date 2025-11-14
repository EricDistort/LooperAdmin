// src/screens/Users.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { supabase } from '../../utils/supabaseClient';

interface User {
  id: number;
  username: string;
  phone: string;
  created_at: string;
  state: { name: string } | null;
  city: { name: string } | null;
  store: { name: string } | null;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        username,
        phone,
        created_at,
        state:states(name),
        city:cities(name),
        store:stores(name)
      `);
    if (error) {
      console.error(error);
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <Text style={styles.username}>{item.username}</Text>
      <Text>Phone: {item.phone}</Text>
      <Text>State: {item.state?.name || 'N/A'}</Text>
      <Text>City: {item.city?.name || 'N/A'}</Text>
      <Text>Store: {item.store?.name || 'N/A'}</Text>
      <Text>Joined: {new Date(item.created_at).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Users</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  username: { fontSize: 18, fontWeight: '600', marginBottom: 5 },
});
