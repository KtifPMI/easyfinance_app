import React, { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import { Button, Input } from '../../components/common'
import { useAuthStore } from '../../store/authStore'
import { colors, spacing, typography } from '../../theme'

export function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const onLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Введите логин и пароль')
      return
    }
    clearError()
    try {
      await login(email.trim(), password)
    } catch (e: any) {
      Alert.alert('Ошибка входа', e?.message || String(e))
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>EasyFinance</Text>
        <Text style={styles.subtitle}>Учёт финансов под контролем</Text>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Input
            label="Логин (email)"
            placeholder="example@mail.ru"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Input
            label="Пароль"
            placeholder='••••••••'
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={{ marginTop: spacing.md }}
          />

          <Button
            title="Войти"
            onPress={onLogin}
            loading={isLoading}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl },
  logo: { ...typography.h1, color: colors.primary, textAlign: 'center' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xxl },
  form: { marginTop: spacing.lg },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center', marginBottom: spacing.sm },
})
