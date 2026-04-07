import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { createCategoria, updateCategoria } from '../../../src/services/categoria.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing } from '../../../src/theme/spacing';
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
        showToast('Categoría actualizada', 'success');
      } else {
        await createCategoria({ nombre: nombre.trim() });
        showToast('Categoría creada', 'success');
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
        <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.dark} />
            </TouchableOpacity>
            <Text style={styles.title}>
                {isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
            </Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
                <Text style={styles.sectionTitle}>DATOS DE LA CATEGORÍA</Text>
                
                <Input
                    label="NOMBRE DE CATEGORÍA *"
                    value={nombre}
                    onChangeText={(v) => {
                        setNombre(v);
                        if (error) setError('');
                    }}
                    placeholder="Ej. Accesorios, Bases, etc."
                    error={error}
                    autoFocus
                />

                <Button
                    title={isEditing ? 'GUARDAR CAMBIOS' : 'CREAR CATEGORÍA'}
                    loading={saving}
                    onPress={handleSubmit}
                    style={styles.submitBtn}
                />
            </View>
        </ScrollView>
        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.dark },
  title: { fontSize: 20, fontWeight: '900', color: Colors.dark },
  scrollContent: { padding: 20, paddingBottom: 160 },
  formCard: { 
    backgroundColor: '#FFF', 
    borderRadius: 24, 
    padding: 20, 
    borderWidth: 3, 
    borderColor: Colors.dark, 
    shadowColor: Colors.dark, 
    shadowOffset: { width: 6, height: 6 }, 
    shadowOpacity: 1,
    elevation: 5
  },
  sectionTitle: { 
    fontSize: 10, 
    fontWeight: '900', 
    color: Colors.primary, 
    marginBottom: 20, 
    textTransform: 'uppercase', 
    letterSpacing: 1.5 
  },
  submitBtn: { 
    marginTop: 20, 
    height: 55,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    elevation: 5
  },
});
