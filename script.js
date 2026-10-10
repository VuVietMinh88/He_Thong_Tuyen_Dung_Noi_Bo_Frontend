const fs = require('fs');
const file = 'd:/He_Thong_Tuyen_Dung_Noi_Bo_Frontend/src/components/layout/Sidebar.tsx';
let content = fs.readFileSync(file, 'utf8');

const pathsToHide = [
  '/headcount-budget',
  '/settings/competency-frameworks',
  '/settings/positions',
  '/settings/interview-questions',
  '/settings/recruitment-catalogs',
  '/candidates',
  '/interviews'
];

pathsToHide.forEach(path => {
  const safePath = path.replace(/\//g, '\\/');
  const regex = new RegExp('  \\{[^}]*to: \\'' + safePath + \\''[^}]*\\},\\n?', 'g');
  content = content.replace(regex, '');
});

fs.writeFileSync(file, content, 'utf8');
