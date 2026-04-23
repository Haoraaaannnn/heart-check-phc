type BreadcrumbNavProps = {
  selectedCategory: string | null;
  selectedSubcategory: string | null;
  selectedRoom: number | null;
  isConsultation: boolean;
  onReset: () => void;
  onResetToCategory: () => void;
  onResetToSubcategory: () => void;
};

export function BreadcrumbNav({
  selectedCategory,
  selectedSubcategory,
  selectedRoom,
  isConsultation,
  onReset,
  onResetToCategory,
  onResetToSubcategory,
}: BreadcrumbNavProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
      <button 
        onClick={onReset}
        className={`hover:text-[#cc3535] transition ${!selectedCategory ? 'text-[#cc3535] font-semibold' : ''}`}
      >
        Services
      </button>
      {selectedCategory && (<><span>/</span>
        <button 
          onClick={onResetToCategory}
          className={`hover:text-[#cc3535] transition ${selectedCategory && !selectedSubcategory && !selectedRoom ? 'text-[#cc3535] font-semibold' : ''}`}
        >
          {selectedCategory}
        </button>
      </>)}
      {isConsultation && selectedSubcategory && (<><span>/</span>
        <button 
          onClick={onResetToSubcategory}
          className={`hover:text-[#cc3535] transition ${selectedSubcategory && !selectedRoom ? 'text-[#cc3535] font-semibold' : ''}`}
        >
          {selectedSubcategory}
        </button>
      </>)}
      {selectedRoom && (<><span>/</span>
        <span className="text-[#cc3535] font-semibold">Room {selectedRoom}</span>
      </>)}
    </div>
  );
}