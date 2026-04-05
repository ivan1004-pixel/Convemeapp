import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getCuentasBancarias, createCuentaBancaria, updateCuentaBancaria } from '../../../src/services/cuenta-bancaria.service';
import { useCuentaBancariaStore } from '../../../src/store/cuentaBancariaStore';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { useColorScheme } from '../../../src/hooks/use-color-scheme';
import { parseGraphQLError } from '../../../src/utils';

export default function CuentaBancariaCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const theme = isDark ? Colors.dark2 : Colors.light2;
  const { addCuentaBancaria, updateCuentaBancaria: updateStore } = useCuentaBancariaStore();

  const [banco, setBanco] = useState('');
  const [titular_cuenta, setTitular] = useState('');
  const [numero_cuenta, setNumeroCuenta] = useState('');
  const [clabe_interbancaria, setClabe] = useState('');
  const [vendedor_id, setVendedorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const all = await getCuentasBancarias();
        const found = all.find((c: any) => String(c.id_cuenta) === String(id));
        if (found) {
          setBanco(found.banco ?? '');
          setTitular(found.titular_cuenta ?? '');
          setNumeroCuenta(found.numero_cuenta ?? '');
          setClabe(found.clabe_interbancaria ?? '');
          setVendedorId(String(found.vendedor?.id_vendedor ?? ''));
        }
      } catch (err) {
        Alert.alert('Error', parseGraphQLError(err));
      } finally {
        setInitializing(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!banco || !titular_cuenta) {
      Alert.alert('Validación', 'Banco y Titular son requeridos.');
      return;
    }
    setLoading(true);
    try {
      const input: any = { banco, titular_cuenta };
      if (numero_cuenta) input.numero_cuenta = numero_cuenta;
      if (clabe_interbancaria) input.clabe_interbancaria = clabe_interbancaria;
      if (vendedor_id) input.vendedor_id = parseInt(vendedor_id, 10);

      if (isEdit) {
        input.id_cuenta = parseInt(id!, 10);
        const updated = await updateCuentaBancaria(input);
        updateStore(updated);
      } else {
        const created = await createCuentaBancaria(input);
        addCuentaBancaria(created);
      }
      router.back();
    } catch (err) {
      Alert.alert('Error', parseGraphQLError(err));
    } finally {
      setLoading(false);
    }
  };

  if (initializing) return <LoadingSpinner />;

  const inputStyle = [styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.backRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.back, { color: Colors.primary }]}>← Volver</Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>{isEdit ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}</Text>

        <Text style={[styles.label, { color: theme.muted }]}>Banco *</Text>
        <TextInput
          style={inputStyle}
          value={banco}
          onChangeText={setBanco}
          placeholder="Nombre del banco"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Titular de la Cuenta *</Text>
        <TextInput
          style={inputStyle}
          value={titular_cuenta}
          onChangeText={setTitular}
          placeholder="Nombre del titular"
          placeholderTextColor={theme.muted}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Número de Cuenta</Text>
        <TextInput
          style={inputStyle}
          value={numero_cuenta}
          onChangeText={setNumeroCuenta}
          placeholder="Número de cuenta"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
        />

        <Text style={[styles.label, { color: theme.muted }]}>CLABE Interbancaria (18 dígitos)</Text>
        <TextInput
          style={inputStyle}
          value={clabe_interbancaria}
          onChangeText={setClabe}
          placeholder="18 dígitos"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
          maxLength={18}
        />

        <Text style={[styles.label, { color: theme.muted }]}>Vendedor ID</Text>
        <TextInput
          style={inputStyle}
          value={vendedor_id}
          onChangeText={setVendedorId}
          placeholder="ID del vendedor"
          placeholderTextColor={theme.muted}
          keyboardType="numeric"
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: Colors.primary }, loading && styles.disabledButton]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitText}>{loading ? 'Guardando...' : isEdit ? 'Actualizar' : 'Crear Cuenta'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xl },
  backRow: { marginBottom: Spacing.sm },
  back: { fontSize: 16, fontWeight: '500' },
  title: { ...Typography.h2, marginBottom: Spacing.lg },
  label: { fontSize: 13, marginBottom: 4, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    fontSize: 15,
    marginBottom: Spacing.md,
  },
  submitButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  disabledButton: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
