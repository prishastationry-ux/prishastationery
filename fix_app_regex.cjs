const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\s*\}\s*return a;\s*\}\);\s*\}\);\s*\}\s*else if \(item\.type === 'rojmel' && item\.data\) \{\s*setRojmelEntries\(prev => \[...prev, item\.data\]\);\s*\} else if \(item\.type === 'print_job' && item\.data\) \{\s*setPrintJobs\(prev => \[...prev, item\.data\]\);\s*\}\s*setTrashList\(prev => prev\.filter\(t => t\.id !== id\)\);\s*showToast\('♻️ આઇટમ સફળતાપૂર્વક પાછી મેળવી લીધી \(Restored\)\!'\);\s*\};\s*\}\s*return a;\s*\}\);\s*\}\);\s*\}\s*else if \(item\.type === 'rojmel' && item\.data\) \{\s*setRojmelEntries\(prev => \[...prev, item\.data\]\);\s*\} else if \(item\.type === 'print_job' && item\.data\) \{\s*setPrintJobs\(prev => \[...prev, item\.data\]\);\s*\}\s*setTrashList\(prev => prev\.filter\(t => t\.id !== id\)\);\s*showToast\('♻️ આઇટમ સફળતાપૂર્વક પાછી મેળવી લીધી \(Restored\)\!'\);\s*\};\s*/;

if (regex.test(code)) {
  code = code.replace(regex, `        return a;\n      }));\n    } else if (item.type === 'rojmel' && item.data) {\n      setRojmelEntries(prev => [...prev, item.data]);\n    } else if (item.type === 'print_job' && item.data) {\n      setPrintJobs(prev => [...prev, item.data]);\n    }\n    \n    setTrashList(prev => prev.filter(t => t.id !== id));\n    showToast('♻️ આઇટમ સફળતાપૂર્વક પાછી મેળવી લીધી (Restored)!');\n  };\n`);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Fixed via regex');
} else {
  console.log('Regex did not match');
}
