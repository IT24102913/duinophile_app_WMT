import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal } from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function ReportModal({ visible, commentId, onClose, onSuccess }) {
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const submitReport = async () => {
    const reason = reportReason.trim();
    if (reason.length < 5) {
      return showAlert('Validation', 'Please provide a reason with at least 5 characters.', 'ERROR');
    }
    if (reason.length > 100) {
      return showAlert('Validation', 'Reporting reason must be less than 100 characters.', 'ERROR');
    }

    setReporting(true);
    try {
      await api.post('/reports', { commentId, reason });
      setReportReason('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      showAlert('Error', err.response?.data?.error || err.message, 'ERROR');
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Comment</Text>
            <Text style={styles.modalSub}>Why are you reporting this comment?</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Enter reason (5-100 characters)..."
              placeholderTextColor="#888"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              maxLength={101}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalCancel]} 
                onPress={onClose}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.modalSubmit]} 
                onPress={submitReport}
                disabled={reporting}
              >
                {reporting ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.modalBtnText}>Submit</Text>}
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
          ['INFO', 'ERROR'].includes(alertConfig.type) ? null : () => setAlertConfig({ ...alertConfig, visible: false })
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 20, width: '85%', borderWidth: 1, borderColor: '#2A2A4A' },
  modalTitle:   { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 8 },
  modalSub:     { color: '#aaa', fontSize: 13, marginBottom: 16 },
  modalInput:   { 
    height: 100, 
    textAlignVertical: 'top', 
    backgroundColor: '#0F0F23', 
    color: '#fff', 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 16, 
    borderWidth: 1, 
    borderColor: '#2A2A4A' 
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  modalBtn:     { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, minWidth: 80, alignItems: 'center' },
  modalCancel:  { backgroundColor: '#333' },
  modalSubmit:  { backgroundColor: '#6C63FF' },
  modalBtnText: { color: '#fff', fontWeight: 'bold' },
});
