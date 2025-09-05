import { cn } from "@/lib/utils";

export const getCardClassName = (
  isGroupCard: boolean,
  isGroupExpanded: boolean,
  activeContentId: string | null,
  contentId: string
) => {
  return cn(
    "bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 rounded-lg p-3 relative",
    isGroupCard && "bg-gradient-to-br from-yellow-600/25 via-orange-600/25 to-amber-600/25 border-yellow-400/60 shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 hover:border-yellow-400/80 transform hover:scale-[1.02] z-10",
    isGroupCard && isGroupExpanded && "col-span-2 ring-2 ring-yellow-400/40 z-20",
    !isGroupCard && "z-5",
    activeContentId === contentId && "ring-4 ring-yellow-400/80 bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-400/20"
  );
};

export const getGroupItemClassName = (activeContentId: string | null, itemId: string) => {
  return cn(
    "bg-white/5 border border-white/20 hover:bg-white/10 transition-all duration-200 rounded-lg p-3 cursor-pointer",
    activeContentId === itemId && "ring-4 ring-yellow-400/80 bg-yellow-500/20 border-yellow-400/70 shadow-lg shadow-yellow-400/20"
  );
};

export const getCurrentStudentId = () => {
  return localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!).id : 'GV0002';
};
