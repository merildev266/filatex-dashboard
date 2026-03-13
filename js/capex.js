/* === CAPEX JS === */

var capexData = {
  enr: {
    color: '#00ab63', colorRgb: '116,184,89',
    title: 'EnR — Énergies Renouvelables (ENAT + LIDERA)',
    projects: [
      {
        id:'enr-1', name:'Nosy Be - Phase 2 2MW + BESS', status:'on-track',
        investInit: '3 764 713 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '3.8 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [6, 6, 6, 4, 4, 4], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '02.05.26', dateDebReel: '02.05.26', dateFinInit: '30.10.26', dateFinReel: '—',
      },
      {
        id:'enr-2', name:'Tulear Phase 2 1MW', status:'on-track',
        investInit: '1 355 701 $', investReel: '804 288 $', deltaInvest: '—',
        etatEnCours: '804 k$', etatTotal: '1.4 M$', etatPct: 59,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [10, 10, 10, 1, 1, 1], cfNet: '—',
        triInit: '11%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '21.10.24', dateDebReel: '21.10.24', dateFinInit: '23.07.25', dateFinReel: '—',
      },
      {
        id:'enr-3', name:'Tulear Phase 3 3.9MW', status:'on-track',
        investInit: '3 611 250 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '3.6 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [8, 8, 8, 2, 2, 2], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '28.02.26', dateDebReel: '28.02.26', dateFinInit: '23.12.26', dateFinReel: '—',
      },
      {
        id:'enr-4', name:'Vestop Solar - Phase 1 4MW Fihaonana', status:'on-track',
        investInit: '3 633 950 $', investReel: '3 484 $', deltaInvest: '—',
        etatEnCours: '3 k$', etatTotal: '3.6 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [5, 5, 5, 5, 5, 5], cfNet: '—',
        triInit: '12%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '04.05.26', dateDebReel: '04.05.26', dateFinInit: '15.11.26', dateFinReel: '—',
      },
      {
        id:'enr-5', name:'Vestop Solar - Fiahonana Phase 2', status:'on-track',
        investInit: '460 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '460 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [10, 10, 10, 1, 1, 1], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '01.02.26', dateDebReel: '01.02.26', dateFinInit: '15.05.26', dateFinReel: '—',
      },
      {
        id:'enr-6', name:'Vestop Solar - Fiahonana Phase 2 15MW', status:'on-track',
        investInit: '15 308 654 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '15.3 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [5, 5, 5, 3, 3, 3], cfNet: '—',
        triInit: '12%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '15.08.26', dateDebReel: '15.08.26', dateFinInit: '15.04.27', dateFinReel: '—',
      },
      {
        id:'enr-7', name:'Mandrosolar Afripower Ph 1 - 15MW Moramanga', status:'delayed',
        investInit: '11 123 707 $', investReel: '3 372 335 $', deltaInvest: '—',
        etatEnCours: '3.4 M$', etatTotal: '11.1 M$', etatPct: 30,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [10, 10, 10, 1, 1, 1], cfNet: '—',
        triInit: '15%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '06.06.25', dateDebReel: '06.06.25', dateFinInit: '02.04.25', dateFinReel: '—',
      },
      {
        id:'enr-8', name:'Mandrosolar Afripower Ph 2 - Studies', status:'on-track',
        investInit: '300 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '300 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [10, 10, 10, 1, 1, 1], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '02.11.25', dateDebReel: '02.11.25', dateFinInit: '15.06.26', dateFinReel: '—',
      },
      {
        id:'enr-9', name:'Mandrosolar Afripower Ph 2 - 25MW Moramanga', status:'on-track',
        investInit: '22 590 550 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '22.6 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [3, 3, 3, 3, 3, 3], cfNet: '—',
        triInit: '11%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '30.05.26', dateDebReel: '30.05.26', dateFinInit: '30.04.27', dateFinReel: '—',
      },
      {
        id:'enr-10', name:'Eolien Diego Ph 1 - 0.12MW (Aelos)', status:'delayed',
        investInit: '1 074 167 $', investReel: '448 385 $', deltaInvest: '—',
        etatEnCours: '448 k$', etatTotal: '1.1 M$', etatPct: 42,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [10, 10, 10, 1, 1, 1], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '23/02/25', dateDebReel: '23/02/25', dateFinInit: '28.03.26', dateFinReel: '—',
      },
      {
        id:'enr-11', name:'Eolien Diego Ph 2 - 4.88MW', status:'on-track',
        investInit: '7 140 560 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '7.1 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [1, 1, 1, 4, 4, 4], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '20.10.26', dateDebReel: '20.10.26', dateFinInit: '15.09.27', dateFinReel: '—',
      },
      {
        id:'enr-12', name:'OURSUN Phase 1 3.2MW', status:'on-track',
        investInit: '5 961 194 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '6.0 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [6, 6, 6, 4, 4, 4], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '15.03.26', dateDebReel: '15.03.26', dateFinInit: '23.12.26', dateFinReel: '—',
      },
      {
        id:'enr-13', name:'OURSUN Phase II 7.8MW', status:'on-track',
        investInit: '7 864 580 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '7.9 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [1, 1, 1, 3, 3, 3], cfNet: '—',
        triInit: '12%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '10.01.27', dateDebReel: '10.01.27', dateFinInit: '20.12.27', dateFinReel: '—',
      },
      {
        id:'enr-14', name:'Top Energie (Bongatsara) Project 5MW', status:'on-track',
        investInit: '4 655 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '4.7 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [8, 8, 8, 2, 2, 2], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '22.12.25', dateDebReel: '22.12.25', dateFinInit: '30.12.26', dateFinReel: '—',
      },
      {
        id:'enr-15', name:'Top Energie (Bongatsara) Studies', status:'on-track',
        investInit: '80 000 $', investReel: '25 733 $', deltaInvest: '—',
        etatEnCours: '26 k$', etatTotal: '80 k$', etatPct: 32,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [10, 10, 10, 1, 1, 1], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '15.04.25', dateDebReel: '15.04.25', dateFinInit: '20.02.26', dateFinReel: '—',
      },
      {
        id:'enr-16', name:'TE Bongatsara Ph 2 Studies', status:'on-track',
        investInit: '120 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '120 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [10, 10, 10, 1, 1, 1], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '15.02.26', dateDebReel: '15.02.26', dateFinInit: '15.08.26', dateFinReel: '—',
      },
      {
        id:'enr-17', name:'TE Bongatsara Ph 2 5MW', status:'on-track',
        investInit: '4 655 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '4.7 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [5, 5, 5, 3, 3, 3], cfNet: '—',
        triInit: '11%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '10.10.26', dateDebReel: '10.10.26', dateFinInit: '12.08.27', dateFinReel: '—',
      },
      {
        id:'enr-18', name:'TE Marais Masay 10MW', status:'on-track',
        investInit: '12 795 253 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '12.8 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [1, 1, 1, 4, 4, 4], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '04.11.26', dateDebReel: '04.11.26', dateFinInit: '10.11.27', dateFinReel: '—',
      },
      {
        id:'enr-19', name:'TE Marais Masay 10MW Studies', status:'on-track',
        investInit: '190 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '190 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [7, 7, 7, 3, 3, 3], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '02.02.26', dateDebReel: '02.02.26', dateFinInit: '30.07.26', dateFinReel: '—',
      },
      {
        id:'enr-20', name:'TE Ambohidratimo 10MW', status:'on-track',
        investInit: '10 205 140 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '10.2 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [1, 1, 1, 5, 5, 5], cfNet: '—',
        triInit: '11%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '01.09.26', dateDebReel: '01.09.26', dateFinInit: '07.09.27', dateFinReel: '—',
      },
      {
        id:'enr-21', name:'TE Ambohidratimo', status:'on-track',
        investInit: '420 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '420 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [10, 10, 10, 1, 1, 1], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '10.02.26', dateDebReel: '10.02.26', dateFinInit: '30.07.26', dateFinReel: '—',
      },
      {
        id:'enr-22', name:'Small Sites', status:'on-track',
        investInit: '2 300 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '2.3 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [1, 1, 1, 3, 3, 3], cfNet: '—',
        triInit: '3%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '05.12.26', dateDebReel: '05.12.26', dateFinInit: '20.07.27', dateFinReel: '—',
      },
      {
        id:'enr-23', name:'LIDERA – Tamatave Green Power Phase 2 - Development', status:'on-track',
        investInit: '18 800 000 $', investReel: '234 000 $', deltaInvest: '-99%',
        etatEnCours: '117 k$', etatTotal: '234 k$', etatPct: 50,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '11%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '21.02.25', dateDebReel: '21.02.25', dateFinInit: '—', dateFinReel: '25.10.25',
      },
      {
        id:'enr-24', name:'LIDERA – Tamatave Green Power 18MW', status:'on-track',
        investInit: '—', investReel: '11 894 495 $', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '11.9 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '26.01.25', dateDebReel: '26.01.25', dateFinInit: '01.09.26', dateFinReel: '27.09.25',
      },
      {
        id:'enr-25', name:'LIDERA – Tamatave Green Power BESS 5MW/10MWh', status:'on-track',
        investInit: '—', investReel: '2 367 200 $', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '2.4 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'enr-26', name:'LIDERA – Diego Green Power - Development', status:'on-track',
        investInit: '—', investReel: '179 000 $', deltaInvest: '—',
        etatEnCours: '90 k$', etatTotal: '179 k$', etatPct: 50,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '13%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '21.02.25', dateDebReel: '21.02.25', dateFinInit: '—', dateFinReel: '25.10.25',
      },
      {
        id:'enr-27', name:'LIDERA – Diego Green Power 7.6MW', status:'on-track',
        investInit: '19 700 000 $', investReel: '6 280 000 $', deltaInvest: '-68%',
        etatEnCours: '—', etatTotal: '6.3 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '26.01.25', dateDebReel: '26.01.25', dateFinInit: '15.01.26', dateFinReel: '27.09.25',
      },
      {
        id:'enr-28', name:'LIDERA – Majunga Green Power - Development', status:'on-track',
        investInit: '—', investReel: '211 000 $', deltaInvest: '—',
        etatEnCours: '106 k$', etatTotal: '211 k$', etatPct: 50,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '13%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '21.02.25', dateDebReel: '21.02.25', dateFinInit: '—', dateFinReel: '25.10.25',
      },
      {
        id:'enr-29', name:'LIDERA – Majunga Green Power 10.75MW', status:'on-track',
        investInit: '26 700 000 $', investReel: '9 074 691 $', deltaInvest: '-66%',
        etatEnCours: '—', etatTotal: '9.1 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '26.01.25', dateDebReel: '26.01.25', dateFinInit: '15.01.26', dateFinReel: '27.09.25',
      },
      {
        id:'enr-30', name:'LIDERA SERV – SODIAMA', status:'on-track',
        investInit: '640 000 $', investReel: '177 822 $', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '178 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '10%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'enr-31', name:'LIDERA SERV – Solarisation Malaga 190kWc', status:'on-track',
        investInit: '354 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '354 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '9%', triReel: '13%', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'enr-32', name:'LIDERA SERV – Solarisation Eden 131kWc', status:'on-track',
        investInit: '294 528 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '295 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '8%', triReel: '10%', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      }
    ]
  },
  hfo: {
    color: '#426ab3', colorRgb: '100,136,255',
    title: 'HFO — Centrales Thermiques',
    projects: [
      {
        id:'hfo-1', name:'Overhaul International (2025 - 19 moteurs)', status:'on-track',
        investInit: '4 846 477 $', investReel: '3 095 007 $', deltaInvest: '—',
        etatEnCours: '1.9 M$', etatTotal: '3.1 M$', etatPct: 61,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '11%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.04.25', dateDebReel: '25.04.25', dateFinInit: '25.07.25', dateFinReel: '—',
      },
      {
        id:'hfo-2', name:'Installation & Commissioning MAN', status:'on-track',
        investInit: '303 000 $', investReel: '1 736 677 $', deltaInvest: '—',
        etatEnCours: '695 k$', etatTotal: '1.7 M$', etatPct: 40,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '13%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.05.25', dateDebReel: '25.05.25', dateFinInit: '25.09.25', dateFinReel: '—',
      },
      {
        id:'hfo-3', name:'Installation & Commissioning 2x6R32', status:'on-track',
        investInit: '1 170 000 $', investReel: '1 451 895 $', deltaInvest: '—',
        etatEnCours: '240 k$', etatTotal: '1.5 M$', etatPct: 17,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '8%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.04.25', dateDebReel: '25.04.25', dateFinInit: '25.09.25', dateFinReel: '—',
      },
      {
        id:'hfo-4', name:'Overhaul Auxiliaire', status:'on-track',
        investInit: '110 000 $', investReel: '530 000 $', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '530 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '8%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.05.25', dateDebReel: '25.05.25', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'hfo-5', name:'Mise en Production FPGS', status:'on-track',
        investInit: '945 000 $', investReel: '1 001 000 $', deltaInvest: '—',
        etatEnCours: '34 k$', etatTotal: '1.0 M$', etatPct: 3,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '4%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.05.25', dateDebReel: '25.05.25', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'hfo-6', name:'SGX / Plant Renovation', status:'on-track',
        investInit: '451 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '451 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '5%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.05.25', dateDebReel: '25.05.25', dateFinInit: '25.04.25', dateFinReel: '—',
      },
      {
        id:'hfo-7', name:'SCADA', status:'on-track',
        investInit: '248 000 $', investReel: '107 000 $', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '107 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '3%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.07.25', dateDebReel: '25.07.25', dateFinInit: '25.09.25', dateFinReel: '—',
      }
    ]
  },
  immo: {
    color: '#FDB823', colorRgb: '248,193,0',
    title: 'Immobilier — Patrimoine (Travaux + Foncier)',
    projects: [
      {
        id:'immo-1', name:'Trano Gasy (Total 9)', status:'on-track',
        investInit: '4 901 400 $', investReel: '3 960 200 $', deltaInvest: '-19%',
        etatEnCours: '1.9 M$', etatTotal: '4.0 M$', etatPct: 48,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '15%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '22.01.22', dateDebReel: '22.01.22', dateFinInit: '—', dateFinReel: '26.01.26',
      },
      {
        id:'immo-2', name:'Eden 8 (Total 8)', status:'on-track',
        investInit: '2 394 000 $', investReel: '2 296 218 $', deltaInvest: '-4%',
        etatEnCours: '1.2 M$', etatTotal: '2.3 M$', etatPct: 50,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '18%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '24.08.25', dateDebReel: '24.08.25', dateFinInit: '—', dateFinReel: '26.02.26',
      },
      {
        id:'immo-3', name:'Vega - Villa Temoin', status:'on-track',
        investInit: '510 638 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '511 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.04.25', dateDebReel: '25.04.25', dateFinInit: '—', dateFinReel: '26.09.26',
      },
      {
        id:'immo-4', name:'ZFI Rooftop Solaire (Ph 1)', status:'on-track',
        investInit: '3 108 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '1.5 M$', etatTotal: '3.1 M$', etatPct: 47,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '24.02.24', dateDebReel: '24.02.24', dateFinInit: '—', dateFinReel: '25.07.25',
      },
      {
        id:'immo-5', name:'ZFI Rooftop Solaire (Ph 2)', status:'on-track',
        investInit: '5 700 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '1.5 M$', etatTotal: '5.7 M$', etatPct: 26,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'immo-6', name:'La Perle', status:'on-track',
        investInit: '637 584 $', investReel: '439 082 $', deltaInvest: '-31%',
        etatEnCours: '78 k$', etatTotal: '439 k$', etatPct: 18,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.04.25', dateDebReel: '25.04.25', dateFinInit: '—', dateFinReel: '25.07.25',
      },
      {
        id:'immo-7', name:'Extension Eden 2 Villas', status:'on-track',
        investInit: '—', investReel: '643 500 $', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '644 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.12.25', dateDebReel: '25.12.25', dateFinInit: '—', dateFinReel: '26.10.25',
      },
      {
        id:'immo-8', name:'Rond Point ZFI', status:'on-track',
        investInit: '680 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '680 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.04.25', dateDebReel: '25.04.25', dateFinInit: '—', dateFinReel: '26.02.26',
      },
      {
        id:'immo-9', name:'Immeuble Hermes Ambatobe', status:'on-track',
        investInit: '16 716 867 $', investReel: '5 065 037 $', deltaInvest: '-70%',
        etatEnCours: '—', etatTotal: '5.1 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '12%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.11.25', dateDebReel: '25.11.25', dateFinInit: '—', dateFinReel: '28.10.28',
      },
      {
        id:'immo-10', name:'OBP', status:'on-track',
        investInit: '9 254 752 $', investReel: '6 815 550 $', deltaInvest: '-26%',
        etatEnCours: '—', etatTotal: '6.8 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '12%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '26.01.26', dateDebReel: '26.01.26', dateFinInit: '—', dateFinReel: '28.01.28',
      },
      {
        id:'immo-11', name:'Hotel Tamatave', status:'on-track',
        investInit: '3 548 000 $', investReel: '2 925 000 $', deltaInvest: '-18%',
        etatEnCours: '—', etatTotal: '2.9 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '9%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.12.25', dateDebReel: '25.12.25', dateFinInit: '—', dateFinReel: '25.12.28',
      },
      {
        id:'immo-12', name:'Casa del Lago', status:'on-track',
        investInit: '36 522 086 $', investReel: '27 343 750 $', deltaInvest: '-25%',
        etatEnCours: '—', etatTotal: '27.3 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '20%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '25.12.25', dateDebReel: '25.12.25', dateFinInit: '—', dateFinReel: '27.12.30',
      },
      {
        id:'immo-13', name:'Phase 1', status:'on-track',
        investInit: '22 000 000 $', investReel: '15 000 000 $', deltaInvest: '-32%',
        etatEnCours: '—', etatTotal: '15 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '26.06.26', dateDebReel: '26.06.26', dateFinInit: '—', dateFinReel: '28.06.28',
      },
      {
        id:'immo-14', name:'Phase 2', status:'on-track',
        investInit: '14 000 000 $', investReel: '14 200 000 $', deltaInvest: '+1%',
        etatEnCours: '—', etatTotal: '14.2 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '27.03.27', dateDebReel: '27.03.27', dateFinInit: '—', dateFinReel: '29.03.29',
      },
      {
        id:'immo-15', name:'Phase 3', status:'on-track',
        investInit: '8 000 000 $', investReel: '14 200 000 $', deltaInvest: '+78%',
        etatEnCours: '—', etatTotal: '14.2 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '28.02.28', dateDebReel: '28.02.28', dateFinInit: '—', dateFinReel: '29.03.30',
      },
      {
        id:'immo-16', name:'ZF Colina', status:'on-track',
        investInit: '15 267 500 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '15.3 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '30%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '01.08.26', dateDebReel: '01.08.26', dateFinInit: '—', dateFinReel: '01.12.28',
      },
      {
        id:'immo-17', name:'Extension Eden 6 villas', status:'on-track',
        investInit: '2 315 086 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '2.3 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '30%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '01.05.27', dateDebReel: '01.05.27', dateFinInit: '—', dateFinReel: '01.06.29',
      },
      {
        id:'immo-18', name:'Résidence Ivatosoa', status:'on-track',
        investInit: '4 132 052 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '4.1 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '20%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '01.04.26', dateDebReel: '01.04.26', dateFinInit: '—', dateFinReel: '01.04.28',
      },
      {
        id:'immo-19', name:'Projet école', status:'on-track',
        investInit: '6 000 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '6 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '9%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '01.06.26', dateDebReel: '01.06.26', dateFinInit: '—', dateFinReel: '08.02.27',
      },
      {
        id:'immo-20', name:'Foncier – Amaya', status:'on-track',
        investInit: '140 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '140 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'immo-21', name:'Foncier – Anosizato 2', status:'on-track',
        investInit: '120 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '120 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'immo-22', name:'Foncier – Vega (Remblayage + cloture)', status:'on-track',
        investInit: '800 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '800 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'immo-23', name:'Foncier – Amaya', status:'on-track',
        investInit: '560 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '560 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'immo-24', name:'Foncier – Anosizato 2', status:'on-track',
        investInit: '480 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '—', etatTotal: '480 k$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      }
    ]
  },
  ventures: {
    color: '#f37056', colorRgb: '255,135,88',
    title: 'Ventures — Investissements Externes',
    projects: [
      {
        id:'ven-1', name:'Hotel Tamatave', status:'on-track',
        investInit: '3 105 000 $', investReel: '2 700 000 $', deltaInvest: '-13%',
        etatEnCours: '1.4 M$', etatTotal: '2.7 M$', etatPct: 50,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '10%', triReel: '15%', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'ven-2', name:'Seedstar/Ampersand', status:'on-track',
        investInit: '5 000 000 $', investReel: '4 347 826 $', deltaInvest: '-13%',
        etatEnCours: '5 M$', etatTotal: '4.3 M$', etatPct: 100,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'ven-3', name:'BGFI', status:'on-track',
        investInit: '1 200 000 $', investReel: '1 275 000 $', deltaInvest: '+6%',
        etatEnCours: '—', etatTotal: '1.3 M$', etatPct: 0,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'ven-4', name:'Hospitality (discussions)', status:'on-track',
        investInit: '10 000 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '3 M$', etatTotal: '10 M$', etatPct: 30,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'ven-5', name:'Education', status:'on-track',
        investInit: '1 725 000 $', investReel: '1 700 000 $', deltaInvest: '-1%',
        etatEnCours: '850 k$', etatTotal: '1.7 M$', etatPct: 50,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '9%', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'ven-6', name:'Energiestro', status:'on-track',
        investInit: '120 000 $', investReel: '100 000 $', deltaInvest: '-17%',
        etatEnCours: '120 k$', etatTotal: '100 k$', etatPct: 100,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'ven-7', name:'Banque Maurice', status:'on-track',
        investInit: '4 000 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '4 M$', etatTotal: '4 M$', etatPct: 100,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'ven-8', name:'Orga Earth (restructure)', status:'delayed',
        investInit: '150 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '150 k$', etatTotal: '150 k$', etatPct: 100,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      },
      {
        id:'ven-9', name:'Oasis', status:'on-track',
        investInit: '5 600 000 $', investReel: '—', deltaInvest: '—',
        etatEnCours: '5.6 M$', etatTotal: '5.6 M$', etatPct: 100,
        cfIn: [0, 0, 0, 0, 0, 0], cfOut: [0, 0, 0, 0, 0, 0], cfNet: '—',
        triInit: '—', triReel: '—', deltaPerf: 'up',
        dateDebInit: '—', dateDebReel: '—', dateFinInit: '—', dateFinReel: '—',
      }
    ]
  }
};

function openCapexSection(pole) {
  const data = capexData[pole];
  const panel = document.getElementById('capex-section-panel');
  const title = document.getElementById('capex-panel-title');
  const content = document.getElementById('capex-panel-content');

  title.style.color = data.color;
  title.textContent = data.title;

  content.innerHTML = data.projects.map(p => renderProjectCard(p, data.color, data.colorRgb)).join('');

  panel.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCapexSection() {
  document.getElementById('capex-section-panel').classList.remove('active');
}

function renderCashflowBars(cfIn, cfOut, color) {
  const months = ['J','F','M','A','M','J'];
  const maxVal = Math.max(...cfIn, ...cfOut);
  return `
    <div style="display:flex;gap:6px;align-items:flex-end;height:50px;margin-top:8px;">
      ${months.map((m,i) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;flex:1;">
          <div style="display:flex;gap:2px;align-items:flex-end;height:36px;">
            <div title="In ${cfIn[i]}M$" style="width:8px;background:rgba(0,171,99,0.7);border-radius:2px 2px 0 0;height:${Math.round((cfIn[i]/maxVal)*100)}%;"></div>
            <div title="Out ${cfOut[i]}M$" style="width:8px;background:rgba(255,107,107,0.6);border-radius:2px 2px 0 0;height:${Math.round((cfOut[i]/maxVal)*100)}%;"></div>
          </div>
          <span style="font-size:7px;color:rgba(255,255,255,0.25);">${m}</span>
        </div>
      `).join('')}
    </div>
    <div style="display:flex;gap:12px;margin-top:6px;">
      <div style="display:flex;align-items:center;gap:4px;"><div style="width:8px;height:8px;border-radius:2px;background:rgba(0,171,99,0.7);"></div><span style="font-size:8px;color:rgba(255,255,255,0.3);">In</span></div>
      <div style="display:flex;align-items:center;gap:4px;"><div style="width:8px;height:8px;border-radius:2px;background:rgba(255,107,107,0.6);"></div><span style="font-size:8px;color:rgba(255,255,255,0.3);">Out</span></div>
    </div>`;
}

function renderProjectCard(p, color, colorRgb) {
  const statusLabel = {
    'on-track': 'En cours',
    'delayed': 'Retard',
    'over-budget': 'Dépassement budget'
  }[p.status];

  const investDeltaIsUp = !p.deltaInvest.startsWith('-') && p.deltaInvest !== '0%';
  const deltaColor = investDeltaIsUp ? '#f37056' : '#00ab63';

  const perfColor = p.deltaPerf === 'up' ? '#00ab63' : '#ff6b6b';

  return `
  <div class="capex-proj-card" style="border-color:rgba(${colorRgb},0.15);">
    <div class="cpj-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 8px ${color};"></div>
        <span class="cpj-name">${p.name}</span>
      </div>
      <span class="cpj-status ${p.status}">${statusLabel}</span>
    </div>
    <div class="cpj-grid">

      <!-- Investissement Initial vs Réel -->
      <div class="cpj-block">
        <div class="cpj-block-label">Investissement</div>
        <div class="cpj-compare">
          <div class="cpj-row">
            <span class="cpj-row-label">Initial</span>
            <span class="cpj-row-init">${p.investInit}</span>
          </div>
          <div class="cpj-row">
            <span class="cpj-row-label">Réel</span>
            <span class="cpj-row-reel" style="color:${color};">${p.investReel}</span>
          </div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:4px;">
            <span style="font-size:10px;font-weight:700;color:${deltaColor};">${p.deltaInvest}</span>
            <span style="font-size:9px;color:rgba(255,255,255,0.3);">vs initial</span>
          </div>
        </div>
      </div>

      <!-- État d'investissement -->
      <div class="cpj-block">
        <div class="cpj-block-label">État d'investissement</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:6px;">${p.etatEnCours} sur ${p.etatTotal}</div>
        <div style="width:100%;height:8px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden;margin-bottom:6px;">
          <div style="height:100%;width:${p.etatPct}%;background:${color};border-radius:4px;transition:width 0.6s;"></div>
        </div>
        <div style="font-size:20px;font-weight:800;color:${color};">${p.etatPct}%</div>
        <div style="font-size:9px;color:rgba(255,255,255,0.3);">engagé sur budget total</div>
      </div>

      <!-- Cashflow -->
      <div class="cpj-block">
        <div class="cpj-block-label">Cashflow (6 mois)</div>
        ${renderCashflowBars(p.cfIn, p.cfOut, color)}
        <div style="margin-top:8px;">
          <span style="font-size:9px;color:rgba(255,255,255,0.4);">Net YTD : </span>
          <span style="font-size:13px;font-weight:700;color:${p.cfNet.startsWith('+') ? '#00ab63' : '#ff6b6b'};">${p.cfNet}</span>
        </div>
      </div>

      <!-- TRI / ROI -->
      <div class="cpj-block">
        <div class="cpj-block-label">TRI / ROI</div>
        <div class="cpj-compare">
          <div class="cpj-row">
            <span class="cpj-row-label">Initial</span>
            <span class="cpj-row-init">${p.triInit}</span>
          </div>
          <div class="cpj-row">
            <span class="cpj-row-label">Réel</span>
            <span class="cpj-row-reel" style="color:${perfColor};">${p.triReel}</span>
          </div>
        </div>
        <div style="margin-top:6px;display:inline-flex;align-items:center;gap:5px;background:rgba(${p.deltaPerf==='up'?'116,184,89':'255,107,107'},0.1);border-radius:6px;padding:3px 8px;">
          <span style="font-size:11px;color:${perfColor};">${p.deltaPerf==='up'?'↑':'↓'}</span>
          <span style="font-size:9px;color:${perfColor};font-weight:700;">${p.deltaPerf==='up'?'Au-dessus':'En dessous'} cible</span>
        </div>
      </div>

      <!-- Date début -->
      <div class="cpj-block">
        <div class="cpj-block-label">Date de début</div>
        <div class="cpj-compare">
          <div class="cpj-row">
            <span class="cpj-row-label">Initial</span>
            <span class="cpj-row-init">${p.dateDebInit}</span>
          </div>
          <div class="cpj-row">
            <span class="cpj-row-label">Réel</span>
            <span class="cpj-row-reel" style="color:${color};">${p.dateDebReel}</span>
          </div>
        </div>
      </div>

      <!-- Date fin -->
      <div class="cpj-block">
        <div class="cpj-block-label">Date de fin</div>
        <div class="cpj-compare">
          <div class="cpj-row">
            <span class="cpj-row-label">Initiale</span>
            <span class="cpj-row-init">${p.dateFinInit}</span>
          </div>
          <div class="cpj-row">
            <span class="cpj-row-label">Prévisionnelle</span>
            <span class="cpj-row-reel" style="color:${p.status==='delayed'?'#f37056':color};">${p.dateFinReel}</span>
          </div>
        </div>
      </div>

    </div>
  </div>`;
}

