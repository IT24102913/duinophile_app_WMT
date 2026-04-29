import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, 
  ActivityIndicator, Modal, KeyboardAvoidingView, Platform,
  TouchableWithoutFeedback, Keyboard
} from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function ReportModal({ visible, commentId, onClose, onSuccess }) {
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setReportReason('');
      setErrorMsg('');
    }
  }, [visible]);

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const submitReport = async () => {
    const reason = reportReason.trim();
    if (reason.length < 5) {
      return setErrorMsg('Please provide a reason with at least 5 characters.');
    }
    if (reason.length > 500) {
      return setErrorMsg('Reporting reason must be less than 500 characters.');
    }

    setErrorMsg('');
    setReporting(true);
    try {
      await api.post('/reports', { commentId, reason });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        setErrorMsg('You have already reported this comment.');
      } else {
        showAlert('Error', err.response?.data?.error || 'Failed to submit report. Please try again.', 'ERROR');
      }
    } finally {
      setReporting(false);
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView 
            style={styles.modalOverlay} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalContent}>
              <View style={styles.header}>
                <Text style={styles.modalTitle}>Report Comment</Text>
                <Text style={styles.modalSub}>Why are you reporting this comment?</Text>
              </View>
              
              <TextInput
                style={[styles.modalInput, errorMsg ? styles.inputError : null]}
                placeholder="Enter your reason (min. 5 characters)..."
                placeholderTextColor="#666"
                value={reportReason}
                onChangeText={(text) => {
                  setReportReason(text);
                  if (errorMsg) setErrorMsg('');
                }}
                multiline
                maxLength={500}
                autoFocus={true}
              />
              
              {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
              
              <View style={styles.charCountContainer}>
                <Text style={styles.charCount}>{reportReason.length}/500</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.modalCancel]} 
                  onPress={onClose}
                  disabled={reporting}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalBtnTextCancel}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.modalBtn, 
                    styles.modalSubmit, 
                    (!reportReason.trim() || reporting) && styles.modalSubmitDisabled
                  ]} 
                  onPress={submitReport}
                  disabled={!reportReason.trim() || reporting}
                  activeOpacity={0.7}
                >
                  {reporting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalBtnText}>Submit Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
        onCancel={
          ['INFO', 'ERROR'].includes(alertConfig.type) 
            ? null 
            : () => setAlertConfig((prev) => ({ ...prev, visible: false }))
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.6)', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20
  },
  modalContent: { 
    backgroundColor: '#1E1E2E', 
    borderRadius: 16, 
    padding: 24, 
    width: '100%',
    maxWidth: 400,
    borderWidth: 1, 
    borderColor: '#33334D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: { marginBottom: 16 },
  modalTitle:   { color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalSub:     { color: '#A0A0B0', fontSize: 14 },
  modalInput:   { 
    height: 120, 
    textAlignVertical: 'top', 
    backgroundColor: '#12121D', 
    color: '#FFFFFF', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#33334D',
    fontSize: 15,
  },
  inputError: { borderColor: '#FF5252' },
  errorText: { color: '#FF5252', fontSize: 13, marginTop: 8, fontWeight: '500' },
  charCountContainer: { alignItems: 'flex-end', marginTop: 8, marginBottom: 16 },
  charCount: { color: '#666', fontSize: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
  modalBtn:     { 
    paddingVertical: 12, 
    paddingHorizontal: 20, 
    borderRadius: 10, 
    minWidth: 90, 
    alignItems: 'center',
    justifyContent: 'center' 
  },
  modalCancel:  { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#444' },
  modalSubmit:  { backgroundColor: '#6C63FF' },
  modalSubmitDisabled: { backgroundColor: '#444455', opacity: 0.7 },
  modalBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15 },
  modalBtnTextCancel: { color: '#A0A0B0', fontWeight: '600', fontSize: 15 },
});
