'use client'

import moment from 'moment';
import { momentLocalizer } from 'react-big-calendar';

// Moment.js için Türkçe yerelleştirme ayarı
moment.locale('tr');

// Takvim için localizer oluştur
export const localizer = momentLocalizer(moment);
