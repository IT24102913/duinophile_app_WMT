import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, RefreshControl, TextInput, TouchableOpacity
} from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function MyReportsScreen() {
  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);
  const [editingReason, setEditingReason] = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get('/reports/my');
      setReports(res.data);
    } catch (err) {
      showAlert('Error', err.message, 'ERROR');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [fetchReports])
  );

  const handleDelete = (reportId) => {
    showAlert(
      'Delete Report',
      'Are you sure you want to delete your report?',
      'DELETE',
      async () => {
        try {
          await api.delete(`/reports/${reportId}`);
          showAlert('Success', 'Report deleted successfully', 'SUCCESS');
          fetchReports();
        } catch (err) {
          showAlert('Error', err.message, 'ERROR');
        }
      }
    );
  };

  const handleEdit = (report) => {
    setEditingReportId(report._id);
    setEditingReason(report.reason);
  };

  const saveEdit = async (reportId) => {
    try {
      if (!editingReason.trim()) return showAlert('Error', 'Reason cannot be empty', 'ERROR');
      await api.put(`/reports/${reportId}`, { reason: editingReason });
      setEditingReportId(null);
      setEditingReason('');
      fetchReports();
    } catch (err) {
      showAlert('Error', err.message, 'ERROR');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':  return { color: '#FF9800' };
      case 'ACCEPTED': return { color: '#4CAF50' };
      case 'REJECTED': return { color: '#F44336' };
      default: return {};
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':  return '⏳';
      case 'ACCEPTED': return '✅';
      case 'REJECTED': return '❌';
      default: return '';
    }
  };

  const renderReport = ({ item }) => {
    const isEditing = editingReportId === item._id;

    return (
      <View style={styles.reportCard}>
        <View style={styles.reportHeader}>
          <Text style={styles.reportLabel}>Report</Text>
          <Text style={[styles.statusBadge, getStatusStyle(item.status)]}>
            {getStatusIcon(item.status)} {item.status}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Reported Comment By:</Text>
          <Text style={styles.infoValue}>{item.commentAuthorName || 'Unknown'}</Text>
        </View>

        <View style={styles.commentBox}>
          <Text style={styles.commentText}>"{item.commentContent}"</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Your Reason:</Text>
        </View>
        
        {isEditing ? (
          <View style={styles.editWrap}>
            <TextInput
              style={styles.textInput}
              value={editingReason}
              onChangeText={setEditingReason}
              multiline
            />
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={() => saveEdit(item._id)}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingReportId(null)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.reasonText}>{item.reason}</Text>
            {item.status === 'PENDING' && (
              <View style={styles.actions}>
                <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={() => handleEdit(item)}>
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => handleDelete(item._id)}>
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <Text style={styles.dateText}>
          Submitted: {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#6C63FF" /></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>📋 My Reports</Text>
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        renderItem={renderReport}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReports(); }} tintColor="#6C63FF" />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>You haven't submitted any reports yet.</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
        onCancel={alertConfig.type === 'DELETE' ? () => setAlertConfig({ ...alertConfig, visible: false }) : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#0F0F23', padding: 16 },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F0F23' },
  heading:      { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 16 },
  reportCard:   { backgroundColor: '#1A1A2E', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#2A2A4A' },
  reportHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  reportLabel:  { color: '#fff', fontWeight: '700', fontSize: 15 },
  statusBadge:  { fontWeight: 'bold', fontSize: 13 },
  infoRow:      { flexDirection: 'row', gap: 6, marginBottom: 4 },
  infoLabel:    { color: '#888', fontSize: 13 },
  infoValue:    { color: '#fff', fontSize: 13, fontWeight: '600' },
  commentBox:   { backgroundColor: '#0F0F23', borderRadius: 8, padding: 10, marginVertical: 8 },
  commentText:  { color: '#ccc', fontStyle: 'italic', lineHeight: 20 },
  reasonText:   { color: '#E0E0E0', lineHeight: 20, marginBottom: 10 },
  dateText:     { color: '#666', fontSize: 11, marginTop: 10 },
  emptyBox:     { alignItems: 'center', marginTop: 60 },
  emptyText:    { color: '#666', fontSize: 16 },
  editWrap:     { marginVertical: 8 },
  textInput:    { backgroundColor: '#0f0f1a', color: '#fff', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#6C63FF', minHeight: 60, textAlignVertical: 'top' },
  editActions:  { flexDirection: 'row', gap: 10, marginTop: 10, justifyContent: 'flex-end' },
  actions:      { flexDirection: 'row', gap: 10, marginVertical: 10, justifyContent: 'flex-end' },
  btn:          { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  saveBtn:      { backgroundColor: '#4CAF50', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cancelBtn:    { backgroundColor: '#F44336', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  editBtn:      { backgroundColor: '#6C63FF' },
  deleteBtn:    { backgroundColor: '#e53935' },
  btnText:      { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
