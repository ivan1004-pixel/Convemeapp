import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createTamano, updateTamano } from '../../../src/services/tamano.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { Toast, useToast } from '../../../src/components/Toast';
import { Button, Input } from '../../../src/components/ui';
import { parseGraphQLError } from '../../../src/utils';

export default function TamanoCreateScreen() {
  const { id, descripcion: descParam } = useLocalSearchParams<{ id?: string; descripcion?: string }>();
  const { toast, show, hide } = useToast();

  const isEditing = !!id;
  const [descripcion, setDescripcion] = useState(descParam ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (!descripcion.trim()) {
      setError('LA DESCRIPCIÓN ES REQUERIDA');
      return;
    }
    setError('');
    setSaving(true);
    try {
      if (isEditing) {
        await updateTamano({ id_tamano: Number(id), descripcion: descripcion.trim() });
        show('Tamaño actualizado correctamente', 'success');
      } else {
        await createTamano({ descripcion: descripcion.trim() });
        show('Tamaño creado correctamente', 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      show(parseGraphQLError(err), 'error');
    } finally {
      setSaving(false);
    }
  }, [descripcion, isEditing, id, show]);

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>
                {isEditing ? 'Editar Tamaño' : 'Nuevo Tamaño'}
            </Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>DATOS DEL TAMAÑO</Text>
                
                <Input
                    label="DESCRIPCIÓN *"
                    value={descripcion}
                    onChangeText={(v) => {
                        setDescripcion(v);
                        if (error) setError('');
                    }}
                    placeholder="Ej. Grande, Mediano, XL..."
                    error={error}
                    autoFocus
                />

                <Button
                    title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR TAMAÑO'}
                    loading={saving}
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                />
            </View>
        </ScrollView>
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hide} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { padding: 20 },
  formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, borderWidth: 3, borderColor: Colors.dark, shadowColor: Colors.dark, shadowOffset: { width: 6, height: 6 }, shadowOpacity: 1 },
  sectionTitle: { fontSize: 12, fontWeight: '900', color: 'rgba(0,0,0,0.4)', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1 },
  submitBtn: { marginTop: 10, height: 55 },
});
