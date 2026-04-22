import { LABEL_ALIASES, LABEL_ICON } from "../catalogData.js";
import {
  Sparkles, ShieldCheck, Brush, WashingMachine, Utensils, Footprints, Wind,
  ShoppingBasket, Droplets, Scissors, SmilePlus, Hand, ScanFace, Slash,
  ScrollText, Layers, Baby, Flower2, Circle, FlaskConical, Bath, ChefHat,
  Paintbrush, Wrench, Sofa, Trash2, FileText, PackageOpen, Pill, Eraser,
  Settings2, Paperclip, Grip, Star, RefreshCw, Leaf, Zap, Flame,
  Coffee, Candy, Wheat, Archive, Cookie, AppWindow, SprayCan,
} from "lucide-react";

const ICON_MAP = {
  Sparkles, ShieldCheck, Brush, WashingMachine, Utensils, Footprints, Wind,
  ShoppingBasket, Droplets, Scissors, SmilePlus, Hand, ScanFace, Slash,
  ScrollText, Layers, Baby, Flower2, Circle, FlaskConical, Bath, ChefHat,
  Paintbrush, Wrench, Sofa, Trash2, FileText, PackageOpen, Pill, Eraser,
  Settings2, Paperclip, Grip, Star, RefreshCw, Leaf, Zap, Flame,
  Coffee, Candy, Wheat, Archive, Cookie, AppWindow, SprayCan,
};

export function normalizeLabel(label) {
  return LABEL_ALIASES[label] || label;
}

/** Повертає Lucide-компонент для мітки або null */
export function getCatIcon(label) {
  const name = LABEL_ICON[label];
  if (!name) return null;
  return ICON_MAP[name] || null;
}
