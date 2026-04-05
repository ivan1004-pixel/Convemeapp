import { create } from 'zustand';
import type { Empleado } from '../types';

interface EmpleadoState {
  empleados: Empleado[];
  selectedEmpleado: Empleado | null;
  isLoading: boolean;
  error: string | null;
  setEmpleados: (empleados: Empleado[]) => void;
  setSelectedEmpleado: (empleado: Empleado | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addEmpleado: (empleado: Empleado) => void;
  updateEmpleado: (updated: Empleado) => void;
  removeEmpleado: (id: number) => void;
}

export const useEmpleadoStore = create<EmpleadoState>((set) => ({
  empleados: [],
  selectedEmpleado: null,
  isLoading: false,
  error: null,
  setEmpleados: (empleados) => set({ empleados }),
  setSelectedEmpleado: (empleado) => set({ selectedEmpleado: empleado }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addEmpleado: (empleado) => set((state) => ({ empleados: [...state.empleados, empleado] })),
  updateEmpleado: (updated) =>
    set((state) => ({
      empleados: state.empleados.map((e) =>
        e.id_empleado === updated.id_empleado ? updated : e
      ),
    })),
  removeEmpleado: (id) =>
    set((state) => ({ empleados: state.empleados.filter((e) => e.id_empleado !== id) })),
}));
