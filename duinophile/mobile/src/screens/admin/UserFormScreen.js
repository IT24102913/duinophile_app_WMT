import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import api from '../../api/axiosConfig';
import CustomAlert from '../../components/common/CustomAlert';

export default function UserFormScreen({ route, navigation }) {
  const editingUser = route.params?.user;
  const isEditing = !!editingUser;

  // Attempt to split existing full name into first and last
  const existingNames = editingUser?.fullName ? editingUser.fullName.split(' ') : [''];
  const initialFirstName = existingNames[0] || '';
  const initialLastName = existingNames.length > 1 ? existingNames.slice(1).join(' ') : '';

  const [form, setForm] = useState({
    firstName: initialFirstName,
    lastName: initialLastName,
    username: editingUser?.username || '',
    email: editingUser?.email || '',
    password: '',
    confirmPassword: '',
    role: editingUser?.role || 'USER'
  });
  const [loading, setLoading] = useState(false);
  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '', type: 'INFO', onConfirm: null });

  const showAlert = (title, message, type = 'INFO', onConfirm = null) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const roles = ['USER', 'STAFF', 'ADMIN'];

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=]).*$/;
    return password.length >= 8 && passwordRegex.test(password);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.username || !form.email) {
      showAlert('Error', 'First Name, Last Name, Username, and Email are required.', 'ERROR');
      return;
    }

    if (!isEditing && !form.password) {
      showAlert('Error', 'Password is required for new users.', 'ERROR');
      return;
    }

    if (form.password) {
      if (form.password !== form.confirmPassword) {
        showAlert('Error', 'Passwords do not match.', 'ERROR');
        return;
      }
      if (!validatePassword(form.password)) {
        showAlert(
          'Weak Password', 
          'Password must be at least 8 characters and include a digit, lowercase, uppercase, and special character.',
          'ERROR'
        );
        return;
      }
    }

    try {
      setLoading(true);
      
      const payload = { 
        fullName: `${form.firstName.trim()} ${form.lastName.trim()}`,
        username: form.username,
        email: form.email,
        role: form.role
      };

      if (form.password) {
        payload.password = form.password;
      }
      
      if (isEditing) {
        await api.put(`/users/${editingUser._id}`, payload);
        showAlert('Success', 'User updated successfully', 'SUCCESS', () => navigation.goBack());
      } else {
        await api.post('/users', payload);
        showAlert('Success', 'User created successfully', 'SUCCESS', () => navigation.goBack());
      }
    } catch (err) {
       showAlert('Error', err.message, 'ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              placeholder="First name"
              placeholderTextColor="#666"
              value={form.firstName}
              onChangeText={(text) => setForm({ ...form, firstName: text })}
            />
          </View>
          <View style={styles.halfInput}>
             <Text style={styles.label}>Last Name</Text>
             <TextInput
              style={styles.input}
              placeholder="Last name"
              placeholderTextColor="#666"
              value={form.lastName}
              onChangeText={(text) => setForm({ ...form, lastName: text })}
            />
          </View>
        </View>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          placeholderTextColor="#666"
          value={form.username}
          onChangeText={(text) => setForm({ ...form, username: text })}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          placeholderTextColor="#666"
          value={form.email}
          onChangeText={(text) => setForm({ ...form, email: text })}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>{isEditing ? 'New Password (Optional)' : 'Password'}</Text>
        <TextInput
          style={styles.input}
          placeholder={isEditing ? 'Leave blank to keep current' : 'Enter password'}
          placeholderTextColor="#666"
          value={form.password}
          onChangeText={(text) => setForm({ ...form, password: text })}
          secureTextEntry
        />

        {(!isEditing || form.password.length > 0) && (
          <>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter password"
              placeholderTextColor="#666"
              value={form.confirmPassword}
              onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
              secureTextEntry
            />
          </>
        )}

        <Text style={styles.label}>Role Selection</Text>
        <View style={styles.roleContainer}>
          {roles.map(r => (
            <TouchableOpacity 
              key={r}
              style={[styles.roleBtn, form.role === r && styles.roleBtnActive]}
              onPress={() => setForm({ ...form, role: r })}
            >
              <Text style={[styles.roleText, form.role === r && styles.roleTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={styles.submitBtn} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
             <ActivityIndicator color="#fff" />
          ) : (
             <Text style={styles.submitBtnText}>{isEditing ? 'Update User' : 'Add User'}</Text>
          )}
        </TouchableOpacity>
      </View>

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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 20 },
  label: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  roleContainer: { flexDirection: 'row', gap: 10, marginTop: 8 },
  roleBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, backgroundColor: '#1a1a2e', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  roleBtnActive: { backgroundColor: '#e5ecff', borderColor: '#6C63FF' },
  roleText: { color: '#cfcfcf', fontSize: 14, fontWeight: 'bold' },
  roleTextActive: { color: '#6C63FF' },
  submitBtn: { backgroundColor: '#6C63FF', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 40 },
  submitBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
