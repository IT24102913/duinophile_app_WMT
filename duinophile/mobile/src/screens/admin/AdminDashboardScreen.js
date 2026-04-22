import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function AdminDashboardScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      showAlert('Error', err.message, 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const handleDeleteUser = (userId) => {
    showAlert(
      'Confirm Delete',
      'Are you sure you want to delete this user?',
      'DELETE',
      async () => {
        try {
          await api.delete(`/users/${userId}`);
          showAlert('Success', 'User deleted successfully', 'SUCCESS');
          fetchUsers();
        } catch (err) {
          showAlert('Error', err.message, 'ERROR');
        }
      }
    );
  };

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.role}>Role: {item.role}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.btn, styles.editBtn]}
          onPress={() => navigation.navigate('UserForm', { user: item })}
        >
          <Text style={styles.btnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.btn, styles.deleteBtn]}
          onPress={() => handleDeleteUser(item._id)}
        >
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Admin Dashboard</Text>

      <Text style={styles.sectionTitle}>User Management</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6C63FF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          renderItem={renderUser}
          contentContainerStyle={{ paddingBottom: 80 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        />
      )}
      <TouchableOpacity 
        style={styles.fab}
        onPress={() => navigation.navigate('UserForm')}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
        onCancel={
          alertConfig.type === 'DELETE' || (alertConfig.type === 'INFO' && alertConfig.title.includes('Confirm'))
          ? () => setAlertConfig({ ...alertConfig, visible: false }) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', paddingHorizontal: 16, paddingTop: 60 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ccc', marginBottom: 16 },
  userCard: { backgroundColor: '#1a1a2e', padding: 16, borderRadius: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  userInfo: { flex: 1 },
  username: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: '#aaa', marginBottom: 4 },
  role: { fontSize: 14, color: '#4caf50', fontWeight: 'bold' },
  actions: { flexDirection: 'row', gap: 8 },
  btn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  editBtn: { backgroundColor: '#6C63FF' },
  deleteBtn: { backgroundColor: '#e53935' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#6C63FF', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  fabText: { fontSize: 32, color: '#fff', fontWeight: 'bold', lineHeight: 34 },
  emptyText: { color: '#aaa', textAlign: 'center', marginTop: 20 }
});
