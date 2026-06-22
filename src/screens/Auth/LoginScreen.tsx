import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { Button, Input } from '../../components/common';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, typography } from '../../theme';

WebBrowser.maybeCompleteAuthSession();

export function LoginScreen() {
  const { startLogin, completeLogin, loginDemo, isLoading, error, clearError } = useAuthStore();
  const [code, setCode] = useState('');
  const [showManualCode, setShowManualCode] = useState(false);
  const [opening, setOpening] = useState(false);

  const onLoginPress = async () => {
    clearError();
    setOpening(true);
    try {
      const authorizeUrl = await startLogin();
      const redirectUri = Linking.createURL('oauth-callback');

      // Открываем системный браузер (НЕ WebView) и ждём редирект обратно
      // в приложение по схеме easyfinanceapp://oauth-callback?code=...
      const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const { queryParams } = Linking.parse(result.url);
        if (queryParams?.access_denied) {
          throw new Error('Доступ отклонён в EasyFinance');
        }
        if (queryParams?.code) {
          await completeLogin(String(queryParams.code));
          return;
        }
      }

      // EasyFinance может не поддерживать кастомный redirect_uri и вернуть
      // код на странице https://api.easyfinance.ru/v2/result?code=...
      // В этом случае пользователь должен скопировать код вручную.
      setShowManualCode(true);
    } catch (e: any) {
      Alert.alert('Ошибка входа', e?.message || String(e));
    } finally {
      setOpening(false);
    }
  };

  const onManualSubmit = async () => {
    if (!code.trim()) return;
    clearError();
    try {
      await completeLogin(code.trim());
    } catch {
      // показано через error
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.logo}>EasyFinance</Text>
        <Text style={styles.subtitle}>Учёт финансов под контролем</Text>

        <View style={styles.form}>
          <Text style={styles.hint}>
            Вход выполняется через ваш аккаунт easyfinance.ru. Нажмите кнопку ниже —
            откроется страница easyfinance.ru, где нужно разрешить доступ приложению.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Войти через EasyFinance"
            onPress={onLoginPress}
            loading={opening || isLoading}
            style={{ marginTop: spacing.md }}
          />

          <Button
            title="Демо-режим (без входа)"
            variant="outline"
            onPress={loginDemo}
            style={{ marginTop: spacing.sm }}
          />

          {showManualCode && (
            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.hint}>
                Если браузер не вернулся в приложение автоматически: после подтверждения
                доступа скопируйте значение параметра "code" из адреса страницы
                (api.easyfinance.ru/v2/result?code=...) и вставьте его сюда.
              </Text>
              <Input
                label="Код подтверждения (code)"
                placeholder="d91df47db90104cd9856e0654ab76fae"
                autoCapitalize="none"
                value={code}
                onChangeText={setCode}
              />
              <Button title="Завершить вход" onPress={onManualSubmit} loading={isLoading} />
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.xl,
  },
  logo: {
    ...typography.h1,
    color: colors.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  form: {
    marginTop: spacing.lg,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
