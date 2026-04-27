import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editPassword, setEditPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const handleSaveProfile = async () => {
    try {
      if (!editUsername.trim() || !editEmail.trim()) {
        return showAlert('Error', 'Username and email are required.', 'ERROR');
      }
      setSaving(true);
      
      const payload = {
        username: editUsername,
        email: editEmail,
        fullName: editFullName,
      };
      if (editPassword) {
        payload.password = editPassword;
      }
      
      const res = await api.put('/users/me', payload);
      updateUser(res.data.user);
      showAlert('Success', 'Profile updated successfully.', 'SUCCESS');
      setEditModalVisible(false);
      setEditPassword('');
    } catch (err) {
      showAlert('Error', err.response?.data?.error || err.message, 'ERROR');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showAlert('Logout', 'Are you sure you want to log out?', 'INFO', logout);
  };

  if (!user) return null;

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{user.username?.charAt(0).toUpperCase()}</Text>
      </View>

      <Text style={styles.username}>@{user.username}</Text>
      <Text style={styles.fullName}>{user.fullName || 'No full name set'}</Text>

      {/* Role Badge */}
      <View style={[styles.roleBadge, { backgroundColor: user.role === 'ADMIN' ? '#F44336' : user.role === 'STAFF' ? '#FF9800' : '#6C63FF' }]}>
        <Text style={styles.roleText}>{user.role}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>🏆 {user.points}</Text>
          <Text style={styles.statLabel}>Points</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoLabel}>Email</Text>
        <Text style={styles.infoValue}>{user.email}</Text>
      </View>

      {/* Edit Profile */}
      <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditModalVisible(true)}>
        <Text style={styles.editProfileText}>✏️ Edit Profile</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput
              style={styles.textInput}
              value={editUsername}
              onChangeText={setEditUsername}
            />

            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.textInput}
              value={editEmail}
              onChangeText={setEditEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.textInput}
              value={editFullName}
              onChangeText={setEditFullName}
            />

            <Text style={styles.inputLabel}>New Password (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={editPassword}
              onChangeText={setEditPassword}
              secureTextEntry
              placeholder="Leave blank to keep current"
              placeholderTextColor="#666"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => {
                  setEditUsername(user.username);
                  setEditEmail(user.email);
                  setEditFullName(user.fullName || '');
                  setEditPassword('');
                  setEditModalVisible(false);
                }}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleSaveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          (alertConfig.type === 'INFO' && alertConfig.title === 'Logout')
          ? () => setAlertConfig({ ...alertConfig, visible: false }) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0F0F23', padding: 24 },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#6C63FF', alignSelf: 'center',
    justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 12,
  },
  avatarText:  { color: '#fff', fontSize: 36, fontWeight: '800' },
  username:    { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  fullName:    { color: '#aaa', fontSize: 15, textAlign: 'center', marginTop: 4, marginBottom: 12 },
  roleBadge:   { alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginBottom: 20 },
  roleText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  statsRow:    { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  statBox:     { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 20, alignItems: 'center', minWidth: 120 },
  statValue:   { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel:   { color: '#aaa', fontSize: 13, marginTop: 4 },
  infoCard:    { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, marginBottom: 12 },
  infoLabel:   { color: '#666', fontSize: 12, marginBottom: 4 },
  infoValue:   { color: '#fff', fontSize: 15 },
  logoutBtn:   { backgroundColor: '#2A1A1A', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: '#FF6B6B' },
  logoutText:  { color: '#FF6B6B', fontWeight: '700', fontSize: 16 },
  editProfileBtn: { backgroundColor: '#1A1A2E', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, borderWidth: 1, borderColor: '#6C63FF' },
  editProfileText: { color: '#6C63FF', fontWeight: '700', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '85%', backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20 },
  modalTitle:   { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  inputLabel:   { color: '#888', fontSize: 12, marginBottom: 4 },
  textInput:    { backgroundColor: '#0F0F23', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#2A2A4A' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalBtn:     { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  cancelBtn:    { backgroundColor: '#3A3A5A' },
  saveBtn:      { backgroundColor: '#6C63FF' },
  btnText:      { color: '#fff', fontWeight: 'bold' }
});
