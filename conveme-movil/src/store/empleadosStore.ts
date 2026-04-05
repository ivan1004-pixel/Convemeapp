import { create } from 'zustand';
import { Empleado } from '../types/empleado';

interface EmpleadosStore {
  empleados: Empleado[];
  selectedEmpleado: Empleado | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setEmpleados: (empleados: Empleado[]) => void;
  addEmpleado: (empleado: Empleado) => void;
  updateEmpleado: (empleado: Empleado) => void;
  removeEmpleado: (id: number) => void;
  setSelectedEmpleado: (empleado: Empleado | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearch: (query: string) => void;
}

export const useEmpleadosStore = create<EmpleadosStore>((set) => ({
  empleados: [],
  selectedEmpleado: null,
  isLoading: false,
  error: null,
  searchQuery: '',
  setEmpleados: (empleados) => set({ empleados }),
  addEmpleado: (empleado) => set((state) => ({ empleados: [empleado, ...state.empleados] })),
  updateEmpleado: (empleado) => set((state) => ({
    empleados: state.empleados.map((e) => e.id_empleado === empleado.id_empleado ? empleado : e),
  })),
  removeEmpleado: (id) => set((state) => ({ empleados: state.empleados.filter((e) => e.id_empleado !== id) })),
  setSelectedEmpleado: (selectedEmpleado) => set({ selectedEmpleado }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearch: (searchQuery) => set({ searchQuery }),
}));
