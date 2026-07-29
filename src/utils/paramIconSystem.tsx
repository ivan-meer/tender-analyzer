import React from 'react';
import { 
  Ruler, 
  Scale, 
  Zap, 
  HardHat, 
  Palette, 
  ShieldCheck, 
  Thermometer, 
  Tag, 
  MapPin, 
  Calendar, 
  Hash, 
  Sliders,
  Maximize2,
  Cpu,
  Monitor,
  Box,
  Truck
} from 'lucide-react';

export interface IconStyleConfig {
  icon: React.ReactNode;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

/**
 * Returns an appropriate Lucide icon and visual badge styling based on parameter name or category
 */
export function getParameterIconConfig(paramName: string, paramValue?: string): IconStyleConfig {
  const nameLower = (paramName || '').toLowerCase();
  const valLower = (paramValue || '').toLowerCase();

  // Dimensions & Sizes
  if (
    nameLower.includes('габарит') || 
    nameLower.includes('размер') || 
    nameLower.includes('длина') || 
    nameLower.includes('ширина') || 
    nameLower.includes('высота') || 
    nameLower.includes('диаметр') || 
    nameLower.includes('толщин') ||
    nameLower.includes('форм-фактор')
  ) {
    return {
      icon: <Ruler className="w-3.5 h-3.5 text-amber-600" />,
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-900',
      borderClass: 'border-amber-200'
    };
  }

  // Weight, Load, Mass
  if (
    nameLower.includes('масса') || 
    nameLower.includes('вес') || 
    nameLower.includes('нагрузк') || 
    valLower.includes('кг') || 
    valLower.includes('тонн')
  ) {
    return {
      icon: <Scale className="w-3.5 h-3.5 text-blue-600" />,
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-900',
      borderClass: 'border-blue-200'
    };
  }

  // Electrical / Power / Processors
  if (
    nameLower.includes('мощност') || 
    nameLower.includes('напряжен') || 
    nameLower.includes('питани') || 
    nameLower.includes('ватт') || 
    nameLower.includes('гц') || 
    nameLower.includes('процессор') ||
    nameLower.includes('память')
  ) {
    return {
      icon: nameLower.includes('процессор') ? <Cpu className="w-3.5 h-3.5 text-purple-600" /> : <Zap className="w-3.5 h-3.5 text-yellow-600" />,
      bgClass: 'bg-purple-50',
      textClass: 'text-purple-900',
      borderClass: 'border-purple-200'
    };
  }

  // Material & Frame & Construction
  if (
    nameLower.includes('материал') || 
    nameLower.includes('каркас') || 
    nameLower.includes('обивка') || 
    nameLower.includes('покрытие') || 
    nameLower.includes('корпус') ||
    nameLower.includes('столешниц')
  ) {
    return {
      icon: <HardHat className="w-3.5 h-3.5 text-slate-700" />,
      bgClass: 'bg-slate-100',
      textClass: 'text-slate-800',
      borderClass: 'border-slate-300'
    };
  }

  // Color
  if (nameLower.includes('цвет') || nameLower.includes('оттенок')) {
    return {
      icon: <Palette className="w-3.5 h-3.5 text-pink-600" />,
      bgClass: 'bg-pink-50',
      textClass: 'text-pink-900',
      borderClass: 'border-pink-200'
    };
  }

  // Warranty & Service
  if (
    nameLower.includes('гаранти') || 
    nameLower.includes('ресурс') || 
    nameLower.includes('цикл') || 
    nameLower.includes('срок службы')
  ) {
    return {
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />,
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-900',
      borderClass: 'border-emerald-200'
    };
  }

  // Address & Location
  if (
    nameLower.includes('адрес') || 
    nameLower.includes('место') || 
    nameLower.includes('склад') || 
    nameLower.includes('город') || 
    nameLower.includes('регион')
  ) {
    return {
      icon: <MapPin className="w-3.5 h-3.5 text-rose-600" />,
      bgClass: 'bg-rose-50',
      textClass: 'text-rose-900',
      borderClass: 'border-rose-200'
    };
  }

  // Delivery terms & dates
  if (
    nameLower.includes('срок') || 
    nameLower.includes('дата') || 
    nameLower.includes('график') || 
    nameLower.includes('поставк')
  ) {
    return {
      icon: <Truck className="w-3.5 h-3.5 text-indigo-600" />,
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-900',
      borderClass: 'border-indigo-200'
    };
  }

  // Display / Resolution
  if (nameLower.includes('экран') || nameLower.includes('диагональ') || nameLower.includes('монитор') || nameLower.includes('разрешен')) {
    return {
      icon: <Monitor className="w-3.5 h-3.5 text-cyan-600" />,
      bgClass: 'bg-cyan-50',
      textClass: 'text-cyan-900',
      borderClass: 'border-cyan-200'
    };
  }

  // Standard / GOST / Codes
  if (nameLower.includes('гост') || nameLower.includes('код') || nameLower.includes('окпд') || nameLower.includes('ктру')) {
    return {
      icon: <Tag className="w-3.5 h-3.5 text-teal-600" />,
      bgClass: 'bg-teal-50',
      textClass: 'text-teal-900',
      borderClass: 'border-teal-200'
    };
  }

  // Default fallback
  return {
    icon: <Sliders className="w-3.5 h-3.5 text-indigo-500" />,
    bgClass: 'bg-slate-50',
    textClass: 'text-slate-800',
    borderClass: 'border-slate-200'
  };
}
