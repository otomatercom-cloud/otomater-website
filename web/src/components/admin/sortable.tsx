"use client";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

/** Drag-and-drop (pointer + keyboard: Space to lift, arrows to move). Reports the new order; callers own the data. */
export function SortableList({ ids, onReorder, children }: { ids: string[]; onReorder: (next: string[]) => void; children: React.ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const end = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    onReorder(arrayMove(ids, ids.indexOf(String(e.active.id)), ids.indexOf(String(e.over.id))));
  };
  return <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={end}><SortableContext items={ids} strategy={verticalListSortingStrategy}>{children}</SortableContext></DndContext>;
}

export function SortableRow({ id, children, className = "" }: { id: string; className?: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = <button type="button" className="cursor-grab touch-none rounded p-1 text-brand-400 hover:bg-brand-100 hover:text-brand-700 active:cursor-grabbing" aria-label="Drag to reorder" {...attributes} {...listeners}><GripVertical size={16} /></button>;
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, zIndex: isDragging ? 10 : undefined }} className={`${className} ${isDragging ? "opacity-70 shadow-lg" : ""}`}>{children(handle)}</div>;
}
