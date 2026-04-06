import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getVendedores } from '../../services/vendedor.service';
import { Colors } from '../../theme/colors';
import { Spacing, BorderRadius } from '../../theme/spacing';
import { SearchBar } from './SearchBar';

interface VendedorPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (vendedor: any) => void;
  selectedId?: number;
}

export const VendedorPicker: React.FC<VendedorPickerProps> = ({
  visible,
  onClose,
  onSelect,
  selectedId,
}) => {
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadVendedores();
    }
  }, [visible]);

  const loadVendedores = async () => {
    setLoading(true);
    try {
      const data = await getVendedores();
      setVendedores(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = vendedores.filter(v => 
    v.nombre_completo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Vendedor</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="close" size={24} color={Colors.dark} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar vendedor..."
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id_vendedor)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.vendedorItem,
                  selectedId === item.id_vendedor && styles.selectedItem
                ]}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              >
                <MaterialCommunityIcons 
                  name="account-tie" 
                  size={20} 
                  color={selectedId === item.id_vendedor ? Colors.primary : Colors.dark} 
                />
                <Text style={[
                  styles.vendedorName,
                  selectedId === item.id_vendedor && styles.selectedText
                ]}>
                  {item.nombre_completo}
                </Text>
                {selectedId === item.id_vendedor && (
                  <MaterialCommunityIcons name="check" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: Spacing.lg,
    borderTopWidth: 4,
    borderColor: Colors.dark,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.dark,
  },
  searchBox: {
    marginBottom: Spacing.md,
  },
  list: {
    paddingBottom: Spacing.xl,
  },
  vendedorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: Spacing.sm,
  },
  selectedItem: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  vendedorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.dark,
    flex: 1,
  },
  selectedText: {
    color: Colors.primary,
  },
});
