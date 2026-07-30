import { VerifiedSupplier } from '../types';

export const VERIFIED_SUPPLIERS: VerifiedSupplier[] = [
  {
    id: 'sup-alvest',
    brandName: 'АЛВЕСТ',
    website: 'https://alvest-mebel.ru/',
    description: 'Мебельная фабрика (Рязань), полный цикл производства, 95% собственных комплектующих.',
    contacts: '8 800-551-44-63 | sales@alvest.su / zakaz@alvest-mebel.ru | Рязань, пр-д Яблочкова, 5 к 26',
    category: 'Стулья, кресла, каркасы под обивку, офисные комплектующие',
    isDomesticProducer: true,
    region: 'Рязанская область (г. Рязань)',
    sampleProducts: [
      { name: 'Кресло операторское АЛВЕСТ А-14', dimensions: '600х600х980 мм', priceRange: '4 800 - 6 200 ₽', okpd2: '31.01.12.110' },
      { name: 'Стул офисный АЛВЕСТ ИЗО на металлокаркасе', dimensions: '530х540х820 мм', priceRange: '1 950 - 2 500 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-riva',
    brandName: 'RIVA',
    website: 'https://riva.ru/',
    description: 'Фабрика офисной мебели (Рязань), сеть складов и шоурумов в РФ (Москва, СПб, Екатеринбург, Новосибирск).',
    contacts: '+7 (495) 642-70-97 | 911@riva.ru | Москва, ш. Энтузиастов, 31 стр. 39',
    category: 'Офисные кресла, стулья, мебель для персонала и руководителей, системы хранения',
    isDomesticProducer: true,
    region: 'Рязанская область / г. Москва',
    sampleProducts: [
      { name: 'Стол рабочий RIVA R-140', dimensions: '1400х700х750 мм', priceRange: '7 500 - 9 800 ₽', okpd2: '31.01.12.110' },
      { name: 'Шкаф для документов RIVA R-200', dimensions: '800х400х1980 мм', priceRange: '11 200 - 14 500 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-fabrikant',
    brandName: 'ФАБРИКАНТ (ГК)',
    website: 'https://fabrikant.su/',
    description: 'Крупный производитель мебели полного цикла (офис, HoReCa, жильё, медицинская мебель).',
    contacts: 'Официальный сайт фабрики: fabrikant.su | Форма связи и дилерская сеть',
    category: 'Офисная, ресторанная, корпусная и мягкая мебель, металлокаркасы',
    isDomesticProducer: true,
    region: 'Российская Федерация',
    sampleProducts: [
      { name: 'Кресло конференционное ФАБРИКАНТ К-10', dimensions: '580х580х920 мм', priceRange: '5 400 - 7 100 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-utfc',
    brandName: 'UTFC',
    website: 'https://utfc.ru/',
    description: 'Российский производитель офисных кресел и стульев (>20 лет на рынке РФ).',
    contacts: 'info@utfc.ru | Поставки через сертифицированную дилерскую сеть',
    category: 'Офисные кресла (руководитель, персонал), стулья, мебель для зон ожидания',
    isDomesticProducer: true,
    region: 'Российская Федерация',
    sampleProducts: [
      { name: 'Кресло руководителя UTFC President', dimensions: '680х680х1200 мм', priceRange: '14 500 - 19 800 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-easychair',
    brandName: 'Easy Chair',
    website: 'https://www.e-chair.ru/',
    description: 'ТМ EasyChair — офисные кресла для руководителей и персонала; в РФ есть официальные склады и дилеры.',
    contacts: 'e-chair.ru | Через региональных дилеров (e-chair.ru, ofsi.ru, bbrc.ru)',
    category: 'Офисные кресла (руководитель, персонал), стулья, комплектующие',
    isDomesticProducer: false,
    note: 'Локализованная сборка и импорт (Китай)',
    region: 'Официальное представительство в РФ',
    sampleProducts: [
      { name: 'Кресло EasyChair 502 Ткань', dimensions: '640х640х1150 мм', priceRange: '8 900 - 11 500 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-alsav',
    brandName: 'Алсав (ALSAV)',
    website: 'https://alsav.ru/',
    description: 'Производственная компания с 1999 г., офисная мебель собственного производства.',
    contacts: '+7 (499) 404-10-77 / +7 (495) 797-67-97 | mebel@alsav.ru | Щёлково, Москва, дер. Осеево (МО)',
    category: 'Офисные кресла, мебель для рабочих мест и переговорных, шкафы, стеллажи, HoReCa',
    isDomesticProducer: true,
    region: 'Московская область (г. Щёлково)',
    sampleProducts: [
      { name: 'Рабочая станция ALSAV Matrix 2x1', dimensions: '1400х1400х750 мм', priceRange: '18 500 - 24 000 ₽', okpd2: '31.01.12.110' },
      { name: 'Тумба подкатная ALSAV с замком', dimensions: '420х500х600 мм', priceRange: '5 800 - 7 200 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-fabrika-stuliev',
    brandName: 'Фабрика Стульев',
    website: 'https://www.fabrika-stuliev.ru/',
    description: 'Производитель стульев, столов и мягкой мебели малых форм для коммерческих пространств.',
    contacts: 'omega-7777@mail.ru | Пн-Чт 08:00–17:00, Пт 09:00–17:00',
    category: 'Стулья, столы, мягкая мебель малых форм, деревянные и металлические каркасы',
    isDomesticProducer: true,
    region: 'Российская Федерация',
    sampleProducts: [
      { name: 'Стул металлический Фабрика Стульев Марсель', dimensions: '450х480х860 мм', priceRange: '2 800 - 3 600 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-mirey',
    brandName: 'Мирей (Мирэй Групп)',
    website: 'https://mirey.ru/',
    description: 'Производитель офисных кресел и стульев (полный цикл, МО), более 100 моделей в каталоге.',
    contacts: '+7 (499) 350-96-70 | info@mirey.ru | г. Подольск (МО)',
    category: 'Офисные кресла и стулья (персонал, руководители, переговорные, коворкинги)',
    isDomesticProducer: true,
    region: 'Московская область (г. Подольск)',
    sampleProducts: [
      { name: 'Кресло сетчатое Mirey Group Ergonomic-X', dimensions: '630х630х1180 мм', priceRange: '9 800 - 12 900 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-chairman',
    brandName: 'CHAIRMAN',
    website: 'https://chairman.ru/',
    description: 'Бренд ТПГ «Тайпит», ведущий российский производитель компьютерных и офисных кресел.',
    contacts: 'chairman.ru | Федеральная дилерская сеть во всех регионах РФ',
    category: 'Компьютерные/офисные кресла, кресла для руководителей, геймерские и детские кресла',
    isDomesticProducer: true,
    region: 'Ленинградская обл. / г. Санкт-Петербург',
    sampleProducts: [
      { name: 'Кресло CHAIRMAN 696 Ткань/Сетка', dimensions: '620х620х980 мм', priceRange: '6 200 - 7 900 ₽', okpd2: '31.01.12.110' },
      { name: 'Кресло руководителя CHAIRMAN 416 Экокожа', dimensions: '670х670х1220 мм', priceRange: '12 800 - 16 500 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-burokrat',
    brandName: 'Бюрократ',
    website: 'https://buro.ru/',
    description: 'Крупнейший производитель офисных стульев, кресел и канцелярских товаров из пластика (МО).',
    contacts: 'buro.ru | Официальные поставки на ЕИС Закупки и ЭТП',
    category: 'Офисные кресла и стулья, канцелярские товары из пластика, системная корпусная мебель',
    isDomesticProducer: true,
    region: 'Московская область (г. Чехов)',
    sampleProducts: [
      { name: 'Кресло Бюрократ CH-330M', dimensions: '580х580х940 мм', priceRange: '4 900 - 6 100 ₽', okpd2: '31.01.12.110' },
      { name: 'Стул офисный Бюрократ Вики', dimensions: '520х530х810 мм', priceRange: '2 100 - 2 800 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-olss',
    brandName: 'OLSS',
    website: 'https://homeandoffice.ru/',
    description: 'Бренд офисных кресел (в т.ч. руководящих, операторских и детских) с представленностью у ритейлеров.',
    contacts: 'Представлен у дилеров: homeandoffice.ru | СПб, ул. Дегтярная, 22',
    category: 'Офисные кресла (руководитель, персонал), детские кресла',
    isDomesticProducer: true,
    region: 'г. Санкт-Петербург',
    sampleProducts: [
      { name: 'Кресло операторское OLSS-Pro', dimensions: '600х600х960 мм', priceRange: '5 200 - 6 800 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-debut',
    brandName: 'Дебют',
    website: 'https://baltoffice.ru/',
    description: 'Российский бренд офисных кресел и стульев для административных учреждений.',
    contacts: 'Через дилерскую сеть (например, BaltOffice)',
    category: 'Офисные кресла и стулья на металлическом каркасе',
    isDomesticProducer: true,
    region: 'Российская Федерация',
    sampleProducts: [
      { name: 'Стул секционный Дебют 3-местный', dimensions: '1500х550х820 мм', priceRange: '7 800 - 9 500 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-nowystyl',
    brandName: 'Nowy Styl',
    website: 'https://www.nowystyl.com/',
    description: 'Европейский лидер комплексных решений для офисов и общественных пространств.',
    contacts: 'newstyle.ru | Дилеры в РФ',
    category: 'Кресла, мягкая мебель, рабочие станции, столы, системы хранения',
    isDomesticProducer: true,
    note: 'Заводы в РФ и СНГ',
    region: 'Российская Федерация / СНГ',
    sampleProducts: [
      { name: 'Кресло ISO Nowy Styl с пюпитром', dimensions: '540х550х820 мм', priceRange: '3 200 - 4 100 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-everprof',
    brandName: 'EverProf',
    website: 'https://everprof.ru/',
    description: 'Поставщик и производитель офисной мебели с развитой сетью представительств в РФ.',
    contacts: '+7 (495) 211-30-05 | msk@everprof.ru | Москва, Адмирала Корнилова, вл55с1',
    category: 'Офисные кресла и мебель для офисов, геймерские кресла',
    isDomesticProducer: true,
    region: 'г. Москва',
    sampleProducts: [
      { name: 'Кресло EverProf Orion Экокожа', dimensions: '650х650х1220 мм', priceRange: '11 500 - 14 900 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-bels',
    brandName: 'Bels',
    website: 'https://bels.by/',
    description: 'ИП ЗАО «БЕЛС» (СЭЗ Брест), крупный производитель кресел, стульев, диванов и корпусной мебели.',
    contacts: 'bels.by | Поставки в РФ: bels.shop | +7 (495) 657-97-37',
    category: 'Офисные кресла (руководитель, операторские), стулья, диваны, корпусная мебель',
    isDomesticProducer: true,
    note: 'Таможенный союз ЕАЭС (Беларусь/РФ)',
    region: 'г. Брест (СЭЗ Брест) / поставки в РФ',
    sampleProducts: [
      { name: 'Кресло Bels Омега GTS', dimensions: '610х610х980 мм', priceRange: '4 500 - 5 900 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-metta',
    brandName: 'Метта (METTA)',
    website: 'https://www.metta.ru/',
    description: 'Международный производитель высокоэргономичных стальных кресел (серия Samurai), производство в Уфе.',
    contacts: '8 (800) 775-84-04 | internet-shop@metta.ru | Уфа, шоурумы в Москве',
    category: 'Эргономичные офисные и компьютерные кресла премиум-класса, стальные каркасы, столы',
    isDomesticProducer: true,
    region: 'Республика Башкортостан (г. Уфа)',
    sampleProducts: [
      { name: 'Эргономичное кресло METTA Samurai SL-1.04', dimensions: '700х700х1250 мм', priceRange: '19 900 - 24 500 ₽', okpd2: '31.01.12.110' },
      { name: 'Кресло METTA Комплект 15', dimensions: '620х620х1050 мм', priceRange: '8 500 - 11 200 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-brabix',
    brandName: 'BRABIX',
    website: 'https://kresla-brabix.ru/',
    description: 'Торговая марка с широким ассортиментом офисных, компьютерных кресел и мебели в стиле лофт.',
    contacts: 'kresla-brabix.ru | Федеральные ритейлеры',
    category: 'Офисные/компьютерные кресла (персонал, руководители), мебель в стиле лофт/сканди',
    isDomesticProducer: false,
    region: 'Представительство в РФ',
    sampleProducts: [
      { name: 'Кресло BRABIX Heavy Duty HD-001 (до 150 кг)', dimensions: '680х680х1200 мм', priceRange: '13 500 - 17 000 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-stylespb',
    brandName: 'Стиль СПБ (Стиль)',
    website: 'https://stylespb.ru/',
    description: 'Производственная компания в Санкт-Петербурге: модельный ряд офисных кресел, стульев, диванов.',
    contacts: '+7 (812) 370-81-43 / +7 (812) 370-86-55 | heys@yandex.ru | СПб, ул. Варшавская, 75',
    category: 'Офисные кресла (руководитель, персонал), стулья, диваны, комплектующие',
    isDomesticProducer: true,
    region: 'г. Санкт-Петербург',
    sampleProducts: [
      { name: 'Диван офисный Стиль СПБ 2-местный', dimensions: '1300х700х780 мм', priceRange: '12 500 - 16 000 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-stimul',
    brandName: 'Стимул',
    website: 'https://stimul-grup.ru/',
    description: 'ГК «Стимул» с 2008 г.: производство и оптовая продажа офисных кресел, стульев, диванов.',
    contacts: '+7 (495) 215-29-95 | ras-e-a@mail.ru | Москва, Стрельбищенский пер., 30 стр. 1А',
    category: 'Офисные кресла, стулья, диваны (собственное производство и дистрибуция)',
    isDomesticProducer: true,
    region: 'г. Москва',
    sampleProducts: [
      { name: 'Кресло Стимул Оператор Ткань', dimensions: '580х580х920 мм', priceRange: '4 200 - 5 500 ₽', okpd2: '31.01.12.110' }
    ]
  },
  {
    id: 'sup-norden',
    brandName: 'Норден',
    website: 'https://norden.group/',
    description: 'Бренд офисной мебели: кабинеты руководителей, мебель для персонала, переговорные зоны.',
    contacts: '+7 (495) 120-33-44 | ng@norden.group | МО, Дмитровский р-н, д. Рождествено',
    category: 'Кабинеты руководителя, мебель для персонала, конференц-зоны, перегородки',
    isDomesticProducer: true,
    region: 'Московская область (Дмитровский р-н)',
    sampleProducts: [
      { name: 'Кабинет руководителя Норден Престиж (Стол+Бриф)', dimensions: '1800х900х760 мм', priceRange: '38 000 - 48 000 ₽', okpd2: '31.01.12.110' }
    ]
  }
];
