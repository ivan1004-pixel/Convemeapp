import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createCategoria, updateCategoria } from '../../../src/services/categoria.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { Button, Input } from '../../../src/components/ui';
import { parseGraphQLError } from '../../../src/utils';

export default function CategoriaCreateScreen() {
  const { id, nombre: nombreParam } = useLocalSearchParams<{ id?: string; nombre?: string }>();
  const { toast, show: showToast, hide: hideToast } = useToast();

  const isEditing = !!id;
  const [nombre, setNombre] = useState(nombreParam ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!nombre.trim()) {
      setError('EL NOMBRE ES REQUERIDO');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await updateCategoria({ id_categoria: Number(id), nombre: nombre.trim() });
        showToast('CATEGORÍA ACTUALIZADA', 'success');
      } else {
        await createCategoria({ nombre: nombre.trim() });
        showToast('CATEGORÍA CREADA', 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setSaving(false);
    }
  }, [nombre, isEditing, id, showToast]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
                </TouchableOpacity>
                <Text style={styles.title}>
                    {isEditing ? 'EDITAR CATEGORÍA' : 'NUEVA CATEGORÍA'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>DATOS DE LA CATEGORÍA</Text>
                    
                    <Input
                        label="NOMBRE DE CATEGORÍA *"
                        value={nombre}
                        onChangeText={(v) => {
                            setNombre(v);
                            if (error) setError('');
                        }}
                        placeholder="EJ: ACCESORIOS, BASES, ETC."
                        error={error}
                        autoFocus
                        autoCapitalize="characters"
                        leftIcon={<MaterialCommunityIcons name="tag" size={20} color={Colors.primary} />}
                    />

                    <Button
                        title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR CATEGORÍA'}
                        loading={saving}
                        onPress={handleSubmit}
                        size="lg"
                        style={styles.submitBtn}
                    />
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 160 },
  card: { backgroundColor: '#FFFFFF', borderRadius: BorderRadius.xl, padding: 20, marginBottom: 25, borderWidth: 2, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 3 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 20 },
  submitBtn: { marginTop: 10, shadowColor: Colors.dark, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, elevation: 5 },
});
