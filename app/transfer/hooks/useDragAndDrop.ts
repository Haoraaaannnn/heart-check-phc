'use client';
import { useState, useRef } from 'react';
import { sendSMS } from '@/app/actions/sendSMS';
import { supabase } from '@/lib/supabase';
import { Patient } from '../types';
import { MAX_PATIENTS_PER_CUBICLE } from '../lib/constants';

export function useDragAndDrop(
  assignedPatients: Record<string, Patient[]>,
  setOnProgressPatients: React.Dispatch<React.SetStateAction<Patient[]>>,
  setAssignedPatients: React.Dispatch<React.SetStateAction<Record<string, Patient[]>>>
) {
  const [draggedPatient, setDraggedPatient] = useState<Patient | null>(null);
  const [dragSourceCubicle, setDragSourceCubicle] = useState<string | null>(null);
  const [dragOverCubicle, setDragOverCubicle] = useState<string | null>(null);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const resetDrag = () => {
    setDraggedPatient(null);
    setDragSourceCubicle(null);
    setDragOverCubicle(null);
    dragStartPos.current = null;
  };

  const handleDragStartFromQueue = (e: React.MouseEvent, patient: Patient) => {
    e.preventDefault();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDraggedPatient(patient);
    setDragSourceCubicle(null);
  };

  const handleDragStartFromCubicle = (e: React.MouseEvent, patient: Patient, cubicleNum: string) => {
    e.preventDefault();
    e.stopPropagation();
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    setDraggedPatient(patient);
    setDragSourceCubicle(cubicleNum);
  };

  const handleMoveBackToProgress = async (patient: Patient, oldCubicleNum: string) => {
    setAssignedPatients(prev => ({
      ...prev,
      [oldCubicleNum]: (prev[oldCubicleNum] || []).filter(p => p.id !== patient.id)
    }));
    setOnProgressPatients(prev => [...prev, { ...patient, cubicleNum: undefined, status: 'On Progress' }]);
    
    await supabase.from('patients').update({ 
      cubicleNum: null, 
      status: 'On Progress'
    }).eq('id', patient.id);
  };

  const setupGlobalDragHandlers = (isDragEnabled: boolean) => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!draggedPatient || !dragStartPos.current) return;
      
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      let targetCubicle = null;
      
      for (let el of elements) {
        const cubicleAttr = (el as HTMLElement).getAttribute('data-cubicle');
        if (cubicleAttr) {
          targetCubicle = cubicleAttr;
          break;
        }
      }
      
      setDragOverCubicle(targetCubicle);
    };

    const handleGlobalMouseUp = async (e: MouseEvent) => {
      if (!draggedPatient) {
        resetDrag();
        return;
      }
      
      if (dragOverCubicle) {
        const targetCount = assignedPatients[dragOverCubicle]?.length || 0;
        if (targetCount >= MAX_PATIENTS_PER_CUBICLE) {
          resetDrag();
          return;
        }

        const now = new Date().toISOString();

        if (dragSourceCubicle) {
          setAssignedPatients(prev => ({
            ...prev,
            [dragSourceCubicle]: (prev[dragSourceCubicle] || []).filter(p => p.id !== draggedPatient.id),
            [dragOverCubicle]: [...(prev[dragOverCubicle] || []), { ...draggedPatient, cubicleNum: dragOverCubicle, status: 'Assigned' }]
          }));
          await supabase.from('patients').update({ 
            cubicleNum: dragOverCubicle, 
            status: 'Assigned'
          }).eq('id', draggedPatient.id);
        } else {
          setOnProgressPatients(prev => prev.filter(p => p.id !== draggedPatient.id));
          setAssignedPatients(prev => ({
            ...prev,
            [dragOverCubicle]: [...(prev[dragOverCubicle] || []), { 
              ...draggedPatient, 
              cubicleNum: dragOverCubicle, 
              status: 'Assigned',
              queue_start: now
            }]
          }));
          
          await supabase.from('patients').update({ 
            cubicleNum: dragOverCubicle, 
            status: 'Assigned',
            queue_start: now
          }).eq('id', draggedPatient.id);
        }

        if (!dragSourceCubicle && draggedPatient.phoneNum) {
          try {
            await sendSMS(
              String(draggedPatient.phoneNum),
              draggedPatient.patientNum,
              dragOverCubicle
            );
          } catch (err) {
            console.error('SMS error:', err);
          }
        }
      }
      
      resetDrag();
    };

    if (draggedPatient && isDragEnabled) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  };

  return {
    draggedPatient,
    dragOverCubicle,
    handleDragStartFromQueue,
    handleDragStartFromCubicle,
    handleMoveBackToProgress,
    setupGlobalDragHandlers,
    resetDrag,
  };
}