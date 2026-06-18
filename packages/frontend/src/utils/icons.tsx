import React from 'react';
import { 
  Pencil, Book, Flower2, Star, Paintbrush, Utensils, Smile, Sparkles 
} from 'lucide-react';

export const getIcon = (iconName: string, className = "w-5 h-5") => {
  switch (iconName) {
    case 'pencil': return <Pencil className={className} />;
    case 'book': return <Book className={className} />;
    case 'flower': return <Flower2 className={className} />;
    case 'star': return <Star className={className} />;
    case 'brush': return <Paintbrush className={className} />;
    case 'utensils': return <Utensils className={className} />;
    case 'smile': return <Smile className={className} />;
    default: return <Sparkles className={className} />;
  }
};

export const ICON_OPTIONS = [
  { name: 'pencil', label: 'えんぴつ' },
  { name: 'book', label: 'ほん' },
  { name: 'flower', label: 'おはな' },
  { name: 'star', label: 'ほし' },
  { name: 'brush', label: 'えのぐ' },
  { name: 'utensils', label: 'おてつだい' },
  { name: 'smile', label: 'たいそう' }
];
