// src/App.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

// import your screens
import Dashboard from './screens/Dashboard';
import Stores from './screens/Stores';

const App = () => {
  const [activeTab, setActiveTab] = useState('Dashboard');

  const renderScreen = () => {
    switch (activeTab) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Stores':
        return <Stores />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      <View style={styles.sidebar}>
        <TouchableOpacity
          onPress={() => setActiveTab('Dashboard')}
          style={styles.tab}
        >
          <Text
            style={
              activeTab === 'Dashboard' ? styles.activeTabText : styles.tabText
            }
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('Stores')}
          style={styles.tab}
        >
          <Text
            style={
              activeTab === 'Stores' ? styles.activeTabText : styles.tabText
            }
          >
            Stores
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main content */}
      <View style={styles.content}>{renderScreen()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', fontFamily: 'sans-serif' },

  sidebar: {
    width: 200,
    backgroundColor: '#f5f5f5', // light background
    justifyContent: 'center', // center vertically
    alignItems: 'center',
    flexDirection: 'column',
    height: '100vh',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },

  tab: {
    width: '80%',
    paddingVertical: 15,
    marginVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  tabText: {
    color: '#555',
    textAlign: 'center',
    fontWeight: '600',
  },

  activeTabText: {
    color: '#1976d2', // modern blue accent for active tab
    textAlign: 'center',
    fontWeight: '700',
  },

  content: { flex: 1, padding: 20, backgroundColor: '#fafafa' },
});

export default App;
