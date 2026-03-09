import { useColors } from '@/components/utils';
import { useTheme } from '@/hooks/use-theme';
import { useHaptics } from '@/hooks/useHaptics';
import { fetchCurrentUser, registerUser } from '@/lib/auth-api';
import {
    confirmPassword,
    confirmSignUp,
    forgotPassword,
    resendConfirmationCode,
    signIn as cognitoSignIn,
    signUp as cognitoSignUp,
} from '@/lib/cognito';
import {
    signInWithCognitoHostedUI,
    type CognitoHostedUIProvider,
} from '@/lib/cognito-hosted-ui';
import { useAuthStore } from '@/stores/authStore';
import { useStockStore } from '@/stores/stockStore';
import { Ionicons } from '@expo/vector-icons';
import {
    BottomSheetBackdrop,
    BottomSheetModal,
    BottomSheetScrollView,
    BottomSheetTextInput,
    BottomSheetView,
} from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type LoginMode = 'login' | 'signup' | 'forgot' | 'confirm' | 'forgot_confirm';

type LoginBottomSheetProps = {
    loginBottomSheetRef: React.RefObject<BottomSheetModal>;
};

export default function LoginBottomSheet({ loginBottomSheetRef }: LoginBottomSheetProps) {
    const Color = useColors();
    const { isDark } = useTheme();
    const { lightImpact } = useHaptics();
    const { signIn: authSignIn, setUser: authSetUser } = useAuthStore();
    const { setLoginBottomSheetOpen } = useStockStore();

    const [mode, setMode] = useState<LoginMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<'apple' | 'google' | null>(null);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendSuccess, setResendSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    /** After sending reset code, show where it was sent (e.g. "j***@e***.com") and hints. */
    const [forgotCodeSentTo, setForgotCodeSentTo] = useState<string | null>(null);

    const isUserAlreadyExistsError = (err: any): boolean => {
        const name = err?.name || '';
        const code = err?.code || '';
        const msg = (err?.message || '').toLowerCase();
        return (
            name === 'UsernameExistsException' ||
            name === 'AliasExistsException' ||
            code === 'UsernameExistsException' ||
            msg.includes('already exists') ||
            msg.includes('already registered')
        );
    };

    const isAlreadyConfirmedError = (err: any): boolean => {
        const msg = (err?.message || '').toLowerCase();
        return msg.includes('cannot be confirmed') && msg.includes('confirmed');
    };

    const resetForm = useCallback(() => {
        setMode('login');
        setEmail('');
        setPassword('');
        setFirstName('');
        setLastName('');
        setCode('');
        setNewPassword('');
        setError(null);
        setResendSuccess(null);
        setForgotCodeSentTo(null);
    }, []);

    const closeModal = useCallback(() => {
        setLoginBottomSheetOpen(false);
        resetForm();
    }, [setLoginBottomSheetOpen, resetForm]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                appearsOnIndex={0}
                disappearsOnIndex={-1}
                enableTouchThrough={false}
                opacity={0.4}
            />
        ),
        []
    );

    const handleLogin = async () => {
        setError(null);
        if (!email.trim() || !password) {
            setError('Enter email and password');
            return;
        }
        setLoading(true);
        const loginLabel = '[Auth] Login total (modal open)';
        console.time(loginLabel);
        await new Promise((r) => setTimeout(r, 0));
        try {
            const session = await cognitoSignIn(email.trim(), password);
            console.timeEnd(loginLabel);
            authSignIn({
                user: { id: session.sub, email: session.email ?? email.trim() },
                idToken: session.idToken,
            });
            lightImpact();
            closeModal();
            fetchCurrentUser(session.idToken).then(authSetUser).catch(() => {});
        } catch (err: any) {
            console.timeEnd(loginLabel);
            setError(err?.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSignInWithProvider = async (provider: CognitoHostedUIProvider) => {
        setError(null);
        setSocialLoading(provider === 'SignInWithApple' ? 'apple' : 'google');
        try {
            const session = await signInWithCognitoHostedUI(provider);
            try {
                await fetchCurrentUser(session.idToken);
            } catch {
                try {
                    await registerUser(session.idToken, {
                        user_id: session.sub,
                        name: session.name || session.email || 'User',
                        phone_number: 'N/A',
                        email: session.email || '',
                    });
                } catch {
                    // User may already exist in backend; continue to sign in
                }
            }
            authSignIn({
                user: { id: session.sub, email: session.email },
                idToken: session.idToken,
            });
            lightImpact();
            closeModal();
            fetchCurrentUser(session.idToken).then(authSetUser).catch(() => {});
        } catch (err: any) {
            setError(err?.message || 'Sign-in failed');
        } finally {
            setSocialLoading(null);
        }
    };

    const handleSignUp = async () => {
        setError(null);
        if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
            setError('Fill in all fields');
            return;
        }
        setLoading(true);
        await new Promise((r) => setTimeout(r, 0));
        try {
            const result = await cognitoSignUp(email.trim(), password, firstName.trim(), lastName.trim());
            if (result.userConfirmed) {
                const session = await cognitoSignIn(email.trim(), password);
                if (!session?.idToken) {
                    setError('Sign up succeeded but no token was received. Please try logging in.');
                    setLoading(false);
                    return;
                }
                await registerUser(session.idToken, {
                    user_id: session.sub,
                    name: `${firstName.trim()} ${lastName.trim()}`,
                    phone_number: 'N/A',
                    email: email.trim(),
                });
                authSignIn({
                    user: { id: session.sub, email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() },
                    idToken: session.idToken,
                });
                lightImpact();
                closeModal();
                fetchCurrentUser(session.idToken).then(authSetUser).catch(() => {});
            } else {
                setMode('confirm');
                setError(null);
            }
        } catch (err: any) {
            if (isUserAlreadyExistsError(err)) {
                setMode('confirm');
                setError('This email is already registered. Enter the confirmation code we sent, or resend a new code below.');
            } else {
                setError(err?.message || 'Sign up failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        if (!email.trim()) return;
        setError(null);
        setResendSuccess(null);
        setResendLoading(true);
        try {
            await resendConfirmationCode(email.trim());
            setResendSuccess('A new code was sent to your email.');
            lightImpact();
        } catch (err: any) {
            setError(err?.message || 'Failed to resend code');
        } finally {
            setResendLoading(false);
        }
    };

    const handleConfirmCode = async () => {
        setError(null);
        if (!code.trim()) {
            setError('Enter the verification code');
            return;
        }
        setLoading(true);
        await new Promise((r) => setTimeout(r, 0));
        try {
            await confirmSignUp(email.trim(), code.trim());
            const session = await cognitoSignIn(email.trim(), password);
            if (!session?.idToken) {
                setError('Login succeeded but no token was received. Please try again.');
                setLoading(false);
                return;
            }
            await registerUser(session.idToken, {
                user_id: session.sub,
                name: `${firstName.trim()} ${lastName.trim()}`,
                phone_number: 'N/A',
                email: email.trim(),
            });
            authSignIn({
                user: { id: session.sub, email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() },
                idToken: session.idToken,
            });
            lightImpact();
            closeModal();
            fetchCurrentUser(session.idToken).then(authSetUser).catch(() => {});
        } catch (err: any) {
            if (isAlreadyConfirmedError(err)) {
                try {
                    const session = await cognitoSignIn(email.trim(), password);
                    if (!session?.idToken) {
                        setError('Account is already confirmed. Please log in with your email and password.');
                        setLoading(false);
                        return;
                    }
                    try {
                        await registerUser(session.idToken, {
                            user_id: session.sub,
                            name: `${firstName.trim()} ${lastName.trim()}`,
                            phone_number: 'N/A',
                            email: email.trim(),
                        });
                    } catch {
                        // User may already exist in backend; still log them in
                    }
                    authSignIn({
                        user: { id: session.sub, email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() },
                        idToken: session.idToken,
                    });
                    lightImpact();
                    closeModal();
                    fetchCurrentUser(session.idToken).then(authSetUser).catch(() => {});
                } catch (signInErr: any) {
                    setError('Account is already confirmed. Please log in with your email and password.');
                }
            } else {
                setError(err?.message || 'Verification failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSend = async () => {
        setError(null);
        setForgotCodeSentTo(null);
        if (!email.trim()) {
            setError('Enter your email');
            return;
        }
        setLoading(true);
        try {
            const result = await forgotPassword(email.trim());
            setForgotCodeSentTo(result.destination ?? null);
            setMode('forgot_confirm');
            setError(null);
        } catch (err: any) {
            const code = err?.code ?? err?.name;
            const msg = err?.message ?? 'Failed to send reset code';
            if (code === 'UserNotFoundException' || msg?.toLowerCase().includes('user not found')) {
                setError('No account found with this email. Check the address or sign up.');
            } else if (code === 'LimitExceededException' || msg?.toLowerCase().includes('limit exceeded')) {
                setError('Too many attempts. Please wait a few minutes and try again.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleForgotConfirm = async () => {
        setError(null);
        if (!code.trim() || !newPassword) {
            setError('Enter code and new password');
            return;
        }
        setLoading(true);
        try {
            await confirmPassword(email.trim(), code.trim(), newPassword);
            setMode('login');
            setCode('');
            setNewPassword('');
            setError(null);
        } catch (err: any) {
            setError(err?.message || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = [
        styles.input,
        { backgroundColor: isDark ? '#242428' : '#F3F4F6', color: Color.baseText },
    ];
    const labelStyle = [styles.label, { color: Color.subText }];

    const content = (
        <BottomSheetScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: Color.baseText }]}>
                    {mode === 'login' && 'Log in'}
                    {mode === 'signup' && 'Sign up'}
                    {mode === 'forgot' && 'Reset password'}
                    {mode === 'confirm' && 'Confirm email'}
                    {mode === 'forgot_confirm' && 'New password'}
                </Text>
                <Text style={[styles.subtitle, { color: Color.subText }]}>
                    {mode === 'login' && 'Sign in to your account'}
                    {mode === 'signup' && 'Create an account'}
                    {mode === 'forgot' && "We'll send a code to your email"}
                    {mode === 'confirm' && 'Enter the code we sent to your email'}
                    {mode === 'forgot_confirm' && 'Enter the code and choose a new password'}
                </Text>
            </View>

            {error ? (
                <View style={[styles.errorBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)' }]}>
                    <Text style={[styles.errorText, { color: Color.red }]}>{error}</Text>
                </View>
            ) : null}

            {mode === 'login' && (
                <>
                    <Text style={labelStyle}>Email</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={Color.subText}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        editable={!loading}
                    />
                    <Text style={labelStyle}>Password</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={Color.subText}
                        secureTextEntry
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: Color.green }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Log in</Text>}
                    </TouchableOpacity>

                    <View style={styles.socialDivider}>
                        <View style={[styles.socialDividerLine, { backgroundColor: Color.subText }]} />
                        <Text style={[styles.socialDividerText, { color: Color.subText }]}>or</Text>
                        <View style={[styles.socialDividerLine, { backgroundColor: Color.subText }]} />
                    </View>

                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}
                        onPress={() => handleSignInWithProvider('SignInWithApple')}
                        disabled={!!socialLoading}
                    >
                        {socialLoading === 'apple' ? (
                            <ActivityIndicator size="small" color={Color.baseText} />
                        ) : (
                            <>
                                <Ionicons name="logo-apple" size={20} color={Color.baseText} style={styles.socialIcon} />
                                <Text style={[styles.socialButtonText, { color: Color.baseText }]}>Sign in with Apple</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.socialButton, { backgroundColor: isDark ? '#1a1a1a' : '#fff', borderColor: isDark ? '#333' : '#ddd' }]}
                        onPress={() => handleSignInWithProvider('Google')}
                        disabled={!!socialLoading}
                    >
                        {socialLoading === 'google' ? (
                            <ActivityIndicator size="small" color={Color.baseText} />
                        ) : (
                            <>
                                <Ionicons name="logo-google" size={20} color={Color.baseText} style={styles.socialIcon} />
                                <Text style={[styles.socialButtonText, { color: Color.baseText }]}>Sign in with Google</Text>
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkButton} onPress={() => { setMode('signup'); setError(null); lightImpact(); }}>
                        <Text style={[styles.linkText, { color: Color.green }]}>Sign up</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => { setMode('forgot'); setError(null); lightImpact(); }}>
                        <Text style={[styles.linkText, { color: Color.subText }]}>Forgot password?</Text>
                    </TouchableOpacity>
                </>
            )}

            {mode === 'signup' && (
                <>
                    <Text style={labelStyle}>First name</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={firstName}
                        onChangeText={setFirstName}
                        placeholder="First name"
                        placeholderTextColor={Color.subText}
                        autoCapitalize="words"
                        editable={!loading}
                    />
                    <Text style={labelStyle}>Last name</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={lastName}
                        onChangeText={setLastName}
                        placeholder="Last name"
                        placeholderTextColor={Color.subText}
                        autoCapitalize="words"
                        editable={!loading}
                    />
                    <Text style={labelStyle}>Email</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={Color.subText}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        autoCorrect={false}
                        editable={!loading}
                    />
                    <Text style={labelStyle}>Password</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        placeholderTextColor={Color.subText}
                        secureTextEntry
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: Color.green }]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign up</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => { setMode('login'); setError(null); lightImpact(); }}>
                        <Text style={[styles.linkText, { color: Color.subText }]}>Back to login</Text>
                    </TouchableOpacity>
                </>
            )}

            {mode === 'forgot' && (
                <>
                    <Text style={labelStyle}>Email</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="you@example.com"
                        placeholderTextColor={Color.subText}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: Color.green }]}
                        onPress={handleForgotSend}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Send reset code</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => { setMode('login'); setError(null); lightImpact(); }}>
                        <Text style={[styles.linkText, { color: Color.subText }]}>Back to login</Text>
                    </TouchableOpacity>
                </>
            )}

            {mode === 'confirm' && (
                <>
                    <Text style={labelStyle}>Verification code</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={code}
                        onChangeText={(t) => { setCode(t); setResendSuccess(null); }}
                        placeholder="Enter code"
                        placeholderTextColor={Color.subText}
                        keyboardType="number-pad"
                        editable={!loading}
                    />
                    {resendSuccess ? (
                        <Text style={[styles.resendSuccess, { color: Color.green }]}>{resendSuccess}</Text>
                    ) : null}
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: Color.green }]}
                        onPress={handleConfirmCode}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirm</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={handleResendCode}
                        disabled={resendLoading || loading}
                    >
                        {resendLoading ? (
                            <ActivityIndicator size="small" color={Color.green} />
                        ) : (
                            <Text style={[styles.linkText, { color: Color.green }]}>Resend code</Text>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => { setMode('signup'); setCode(''); setError(null); setResendSuccess(null); lightImpact(); }}>
                        <Text style={[styles.linkText, { color: Color.subText }]}>Back</Text>
                    </TouchableOpacity>
                </>
            )}

            {mode === 'forgot_confirm' && (
                <>
                    <View style={[styles.forgotHintBox, { backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)' }]}>
                        <Text style={[styles.forgotHintText, { color: Color.subText }]}>
                            {forgotCodeSentTo
                                ? `Code sent to ${forgotCodeSentTo}. Check your inbox and spam folder—it can take a few minutes.`
                                : 'Check your email (and spam folder) for the code. It can take a few minutes to arrive.'}
                        </Text>
                    </View>
                    <Text style={labelStyle}>Verification code</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={code}
                        onChangeText={setCode}
                        placeholder="Enter code"
                        placeholderTextColor={Color.subText}
                        keyboardType="number-pad"
                        editable={!loading}
                    />
                    <Text style={labelStyle}>New password</Text>
                    <BottomSheetTextInput
                        style={inputStyle}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="New password"
                        placeholderTextColor={Color.subText}
                        secureTextEntry
                        editable={!loading}
                    />
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: Color.green }]}
                        onPress={handleForgotConfirm}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Reset password</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.linkButton}
                        onPress={handleForgotSend}
                        disabled={loading}
                    >
                        <Text style={[styles.linkText, { color: Color.green }]}>Resend code</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.linkButton} onPress={() => { setMode('login'); setCode(''); setNewPassword(''); setError(null); lightImpact(); }}>
                        <Text style={[styles.linkText, { color: Color.subText }]}>Back to login</Text>
                    </TouchableOpacity>
                </>
            )}

            <View style={styles.bottomSpacing} />
        </BottomSheetScrollView>
    );

    return (
        <BottomSheetModal
            ref={loginBottomSheetRef}
            onDismiss={closeModal}
            stackBehavior="push"
            enableDynamicSizing
            enablePanDownToClose
            backdropComponent={renderBackdrop}
            handleStyle={{ display: 'none' }}
            enableOverDrag
            style={{ borderRadius: 20 }}
            backgroundStyle={{ borderRadius: 20, backgroundColor: isDark ? '#1A1D21' : '#FFFFFF' }}
            keyboardBehavior={Platform.OS === 'ios' ? 'interactive' : undefined}
            keyboardBlurBehavior="restore"
        >
            {Platform.OS === 'ios' ? (
                <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
                    {content}
                </KeyboardAvoidingView>
            ) : (
                content
            )}
        </BottomSheetModal>
    );
}

const styles = StyleSheet.create({
    keyboardView: { flex: 1 },
    scrollView: { flex: 1, borderRadius: 20 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    header: { alignItems: 'center', marginTop: 20, marginBottom: 24 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
    subtitle: { fontSize: 14, marginBottom: 8 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 6, marginTop: 12 },
    input: {
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 4,
    },
    errorBox: { padding: 12, borderRadius: 12, marginBottom: 12 },
    errorText: { fontSize: 14 },
    forgotHintBox: { padding: 12, borderRadius: 12, marginBottom: 16 },
    forgotHintText: { fontSize: 13, lineHeight: 18 },
    primaryButton: {
        marginTop: 20,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    primaryButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
    socialDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 12,
    },
    socialDividerLine: {
        flex: 1,
        height: 1,
        opacity: 0.5,
    },
    socialDividerText: {
        marginHorizontal: 12,
        fontSize: 13,
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        minHeight: 48,
        marginBottom: 10,
    },
    socialIcon: { marginRight: 10 },
    socialButtonText: { fontSize: 16, fontWeight: '500' },
    linkButton: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
    linkText: { fontSize: 15 },
    resendSuccess: { fontSize: 14, marginTop: 8, textAlign: 'center' },
    bottomSpacing: { height: 40 },
});
