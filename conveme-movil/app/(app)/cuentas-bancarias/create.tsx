import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getCuentasBancarias, createCuentaBancaria, updateCuentaBancaria } from '../../../src/services/cuenta-bancaria.service';
import { Colors } from '../../../src/theme/colors';
import { Typography } from '../../../src/theme/typography';
import { Spacing, BorderRadius } from '../../../src/theme/spacing';
import { LoadingSpinner } from '../../../src/components/ui/LoadingSpinner';
import { Toast, useToast } from '../../../src/components/Toast';
import { parseGraphQLError } from '../../../src/utils';
import { NeobrutalistBackground } from '../../../src/components/ui/NeobrutalistBackground';
import { VendedorPicker } from '../../../src/components/ui/VendedorPicker';

export default function CuentaBancariaCreateScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;
  const { toast, show: showToast, hide: hideToast } = useToast();

  const [banco, setBanco] = useState('');
  const [titular_cuenta, setTitular] = useState('');
  const [numero_cuenta, setNumeroCuenta] = useState('');
  const [clabe_interbancaria, setClabe] = useState('');
  const [vendedor_id, setVendedorId] = useState<number | null>(null);
  const [vendedorNombre, setVendedorNombre] = useState('SELECCIONAR VENDEDOR');
  const [showPicker, setShowPicker] = useState(false);
  
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
          if (found.vendedor) {
            setVendedorId(found.vendedor.id_vendedor);
            setVendedorNombre(found.vendedor.nombre_completo.toUpperCase());
          }
        }
      } catch (err) {
        showToast(parseGraphQLError(err), 'error');
      } finally {
        setInitializing(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async () => {
    if (!banco || !titular_cuenta || !numero_cuenta || !vendedor_id) {
      showToast('BANCO, TITULAR, NO. CUENTA Y VENDEDOR SON OBLIGATORIOS.', 'error');
      return;
    }
    setLoading(true);
    try {
      const input: any = { 
        banco: banco.toUpperCase(), 
        titular_cuenta: titular_cuenta.toUpperCase(), 
        numero_cuenta,
        vendedor_id: vendedor_id,
      };
      if (clabe_interbancaria) input.clabe_interbancaria = clabe_interbancaria;

      if (isEdit) {
        input.id_cuenta = parseInt(id!, 10);
        await updateCuentaBancaria(input);
        showToast('CUENTA ACTUALIZADA', 'success');
      } else {
        await createCuentaBancaria(input);
        showToast('CUENTA CREADA', 'success');
      }
      setTimeout(() => router.back(), 1500);
    } catch (err) {
      showToast(parseGraphQLError(err), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) return <LoadingSpinner fullScreen message="CARGANDO..." />;

  return (
    <NeobrutalistBackground>
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEdit ? 'EDITAR CUENTA' : 'NUEVA CUENTA'}</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.formCard}>
              <Text style={styles.label}>BANCO *</Text>
              <TextInput
                style={styles.input}
                value={banco}
                onChangeText={setBanco}
                placeholder="EJ. BBVA, SANTANDER..."
                placeholderTextColor="rgba(0,0,0,0.3)"
                autoCapitalize="characters"
              />

              <Text style={styles.label}>TITULAR DE LA CUENTA *</Text>
              <TextInput
                style={styles.input}
                value={titular_cuenta}
                onChangeText={setTitular}
                placeholder="NOMBRE COMPLETO"
                placeholderTextColor="rgba(0,0,0,0.3)"
                autoCapitalize="characters"
              />

              <Text style={styles.label}>NÚMERO DE CUENTA *</Text>
              <TextInput
                style={styles.input}
                value={numero_cuenta}
                onChangeText={setNumeroCuenta}
                placeholder="10-16 DÍGITOS"
                placeholderTextColor="rgba(0,0,0,0.3)"
                keyboardType="numeric"
              />

              <Text style={styles.label}>CLABE INTERBANCARIA</Text>
              <TextInput
                style={styles.input}
                value={clabe_interbancaria}
                onChangeText={setClabe}
                placeholder="18 DÍGITOS"
                placeholderTextColor="rgba(0,0,0,0.3)"
                keyboardType="numeric"
                maxLength={18}
              />

              <Text style={styles.label}>VENDEDOR ASIGNADO *</Text>
              <TouchableOpacity 
                style={styles.pickerTrigger}
                onPress={() => setShowPicker(true)}
              >
                <MaterialCommunityIcons name="account-tie" size={20} color={Colors.primary} />
                <Text style={[
                  styles.pickerText, 
                  vendedor_id ? { color: Colors.dark } : { color: 'rgba(0,0,0,0.3)' }
                ]}>
                  {vendedorNombre}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.dark} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={loading}
            >
              <Text style={styles.submitText}>{loading ? 'GUARDANDO...' : isEdit ? 'ACTUALIZAR CUENTA' : 'CREAR CUENTA'}</Text>
              {!loading && <MaterialCommunityIcons name="check-bold" size={20} color="#FFF" />}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        <VendedorPicker 
          visible={showPicker}
          onClose={() => setShowPicker(false)}
          selectedId={vendedor_id ?? undefined}
          onSelect={(v) => {
            setVendedorId(v.id_vendedor);
            setVendedorNombre(v.nombre_completo.toUpperCase());
          }}
        />

        <Toast visible={toast.visible} type={toast.type} message={toast.message} onHide={hideToast} />
      </SafeAreaView>
    </NeobrutalistBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: Colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.dark,
  },
  scroll: { padding: 20, paddingBottom: 160 },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: 20,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.dark,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: Colors.dark,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: 15,
    fontWeight: '700',
    color: Colors.dark,
    marginBottom: Spacing.lg,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: Colors.dark,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 10,
  },
  pickerText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 3,
    borderColor: Colors.dark,
    shadowColor: Colors.dark,
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    gap: 10,
  },
  submitText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  disabledButton: { opacity: 0.7 },
});

