'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Patient } from '@/types/Types';

export function useRegistrationDragAndDrop(
  registrationPatients: Patient[],
  setRegistrationPatients: React.Dispatch<React.SetStateAction<Patient[]>>
) {
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  const [dragOverCounter, setDragOverCounter] = useState<number | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleDragStart = (e: React.MouseEvent, patient: Patient) => {
    e.preventDefault();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDraggedPatient(patient);
  };

  useEffect(() => {
    if (!draggedPatient) return;

    const handleMouseMove = (e: MouseEvent) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      let targetCounter = null;
      for (const el of elements) {
        const attr = (el as HTMLElement).getAttribute('data-counter');
        if (attr) {
          targetCounter = parseInt(attr);
          break;
        }
      }
      setDragOverCounter(targetCounter);
    };

    const handleMouseUp = async () => {
      if (draggedPatient && dragOverCounter && dragOverCounter !== draggedPatient.counter) {
        setRegistrationPatients(prev =>
          prev.map(p => p.id === draggedPatient.id ? { ...p, counter: dragOverCounter } : p)
        );

        await supabase
          .from('patients')
          .update({ counter: dragOverCounter })
          .eq('id', draggedPatient.id);
      }

      setDraggedPatient(null);
      setDragOverCounter(null);
      dragStartPos.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggedPatient, dragOverCounter]);

  return {
    regDraggedPatient: draggedPatient,
    dragOverCounter,
    handleRegDragStart: handleDragStart,
  };
}