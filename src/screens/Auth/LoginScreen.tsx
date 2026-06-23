import React, { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing, typography } from '../../theme'

export function LoginScreen() {
  const { login, isLoading, error } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Заполните email и пароль')
      return
    }
    try {
      await login(email.trim(), password)
    } catch (e: any) {
      Alert.alert('Ошибка входа', e?.message || String(e))
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <Text style={styles.logo}>EasyFinance</Text>
        <Text style={styles.subtitle}>Управляйте своими финансами</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.formTitle}>Вход в аккаунт EasyFinance</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="example@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Пароль</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Введите пароль"
            secureTextEntry
            editable={!isLoading}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Войти</Text>
          )}
        </TouchableOpacity>

        <View style={styles.links}>
          <TouchableOpacity>
            <Text style={styles.link}>Забыли пароль?</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.link}>Регистрация</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#fff', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#fff', opacity: 0.8, textAlign: 'center', marginTop: 8 },
  form: { padding: 24, flex: 1 },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text, marginBottom: 24, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8 },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  error: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  links: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  link: { color: colors.primary, fontSize: 14, fontWeight: '600' },
})
