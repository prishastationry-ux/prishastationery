const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const badBlock = `        return a;
      }));
    } else if (item.type === 'rojmel' && item.data) {
      setRojmelEntries(prev => [...prev, item.data]);
    } else if (item.type === 'print_job' && item.data) {
      setPrintJobs(prev => [...prev, item.data]);
    }
    
    setTrashList(prev => prev.filter(t => t.id !== id));
    showToast('♻️ આઇટમ સફળતાપૂર્વક પાછી મેળવી લીધી (Restored)!');
  };        }
        return a;
      }));
    } else if (item.type === 'rojmel' && item.data) {
      setRojmelEntries(prev => [...prev, item.data]);
    } else if (item.type === 'print_job' && item.data) {
      setPrintJobs(prev => [...prev, item.data]);
    }
    
    setTrashList(prev => prev.filter(t => t.id !== id));
    showToast('♻️ આઇટમ સફળતાપૂર્વક પાછી મેળવી લીધી (Restored)!');
  };`;

const goodBlock = `        return a;
      }));
    } else if (item.type === 'rojmel' && item.data) {
      setRojmelEntries(prev => [...prev, item.data]);
    } else if (item.type === 'print_job' && item.data) {
      setPrintJobs(prev => [...prev, item.data]);
    }
    
    setTrashList(prev => prev.filter(t => t.id !== id));
    showToast('♻️ આઇટમ સફળતાપૂર્વક પાછી મેળવી લીધી (Restored)!');
  };`;

if (code.includes(badBlock)) {
  code = code.replace(badBlock, goodBlock);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Successfully replaced bad duplicate block in App.tsx');
} else {
  console.log('badBlock not found directly');
}
