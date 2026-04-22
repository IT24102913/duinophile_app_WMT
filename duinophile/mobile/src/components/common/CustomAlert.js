import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';

const { width } = Dimensions.get('window');

const CustomAlert = ({
  visible,
  title,
  message,
  type = 'INFO',
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  if (!visible) return null;

  const getThemeColor = () => {
    switch (type) {
      case 'SUCCESS':
        return '#4CAF50';
      case 'ERROR':
        return '#FF6B6B';
      case 'DELETE':
        return '#e53935';
      default:
        return '#6C63FF';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'SUCCESS':
        return '✅';
      case 'ERROR':
        return '❌';
      case 'DELETE':
        return '🗑️';
      default:
        return 'ℹ️';
    }
  };

  const themeColor = getThemeColor();

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.alertBox}>
          <View style={[styles.iconContainer, { backgroundColor: `${themeColor}20` }]}>
            <Text style={styles.iconText}>{getIcon()}</Text>
          </View>
          
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: themeColor }]}
              onPress={onConfirm || onCancel}
            >
              <Text style={styles.confirmButtonText}>
                {type === 'DELETE' ? 'Delete' : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1A1A2E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A4A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#2A2A4A',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  cancelButtonText: {
    color: '#ccc',
    fontWeight: '700',
    fontSize: 16,
  },
});

export default CustomAlert;
