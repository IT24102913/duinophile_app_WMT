import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO' });

  const showAlert = (title, message, type = 'INFO') => {
    setAlertConfig({ visible: true, title, message, type });
  };

  const handleLogin = async () => {
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username: username.trim(), password });
      await login(res.data.token, res.data.user);
    } catch (err) {
      showAlert('Login Failed', err.message, 'ERROR');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🎓 Duinophile</Text>
          <Text style={styles.subtitle}>Gamified Learning Platform</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your username"
            placeholderTextColor="#888"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Login</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F23' },
  inner:     { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header:    { alignItems: 'center', marginBottom: 32 },
  logo:      { fontSize: 36, fontWeight: '800', color: '#6C63FF' },
  subtitle:  { color: '#aaa', marginTop: 4, fontSize: 14 },
  card:      { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 24, elevation: 4 },
  title:     { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 20 },
  label:     { color: '#ccc', marginBottom: 6, fontSize: 14 },
  input: {
    backgroundColor: '#0F0F23', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 16, fontSize: 15,
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  btn: {
    backgroundColor: '#6C63FF', padding: 16,
    borderRadius: 10, alignItems: 'center', marginTop: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:    { textAlign: 'center', color: '#aaa', marginTop: 20 },
  linkBold:{ color: '#6C63FF', fontWeight: '700' },
  errorText: {
    color: '#FF6B6B', backgroundColor: '#2A1A1A',
    padding: 10, borderRadius: 8, marginBottom: 12, textAlign: 'center',
  },
});
