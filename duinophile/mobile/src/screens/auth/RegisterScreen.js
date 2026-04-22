import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function RegisterScreen({ navigation }) {
  const [form, setForm]     = useState({ username: '', email: '', fullName: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const set = (key) => (val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validate = () => {
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      showAlert('Required', 'All fields are required.', 'ERROR'); return false;
    }
    if (form.password !== form.confirmPassword) {
      showAlert('Mismatch', 'Passwords do not match.', 'ERROR'); return false;
    }
    if (form.password.length < 8) {
      showAlert('Password too short', 'Password must be at least 8 characters.', 'ERROR'); return false;
    }
    const pwRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
    if (!pwRegex.test(form.password)) {
      setError('Password must contain an uppercase letter, lowercase letter, digit, and special character.'); return false;
    }
    return true;
  };

  const handleRegister = async () => {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/register', {
        username: form.username.trim(),
        email:    form.email.trim(),
        fullName: form.fullName.trim(),
        password: form.password,
      });
      showAlert('Account Created!', 'Please login with your credentials.', 'SUCCESS', () => navigation.navigate('Login'));
    } catch (err) {
      showAlert('Registration Failed', err.message, 'ERROR');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🎓 Duinophile</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Register</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {[
            { key: 'fullName',        label: 'Full Name',        placeholder: 'Your full name',     secure: false },
            { key: 'username',        label: 'Username',         placeholder: 'Alphanumeric only',  secure: false },
            { key: 'email',           label: 'Email',            placeholder: 'your@email.com',     secure: false },
            { key: 'password',        label: 'Password',         placeholder: 'Min 8 characters',   secure: true },
            { key: 'confirmPassword', label: 'Confirm Password', placeholder: 'Re-enter password',  secure: true },
          ].map(({ key, label, placeholder, secure }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#888"
                value={form[key]}
                onChangeText={set(key)}
                secureTextEntry={secure}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={key === 'email' ? 'email-address' : 'default'}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Login</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertConfig({ ...alertConfig, visible: false });
          if (alertConfig.onConfirm) alertConfig.onConfirm();
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F23' },
  inner:     { flexGrow: 1, padding: 24, paddingTop: 60 },
  header:    { alignItems: 'center', marginBottom: 24 },
  logo:      { fontSize: 32, fontWeight: '800', color: '#6C63FF' },
  subtitle:  { color: '#aaa', marginTop: 4, fontSize: 14 },
  card:      { backgroundColor: '#1A1A2E', borderRadius: 16, padding: 24 },
  title:     { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
  label:     { color: '#ccc', marginBottom: 6, fontSize: 14 },
  input: {
    backgroundColor: '#0F0F23', color: '#fff', borderRadius: 10,
    padding: 14, marginBottom: 14, fontSize: 15,
    borderWidth: 1, borderColor: '#2A2A4A',
  },
  btn: { backgroundColor: '#6C63FF', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  link:    { textAlign: 'center', color: '#aaa', marginTop: 16 },
  linkBold:{ color: '#6C63FF', fontWeight: '700' },
  errorText: {
    color: '#FF6B6B', backgroundColor: '#2A1A1A',
    padding: 10, borderRadius: 8, marginBottom: 12, textAlign: 'center',
  },
});
