const fs = require('fs');
const path = require('path');

function fixCorruptedCyrillic(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  
  const map = {
    'РќРѕРІРѕСЃС‚Рё': 'Новости',
    'РЎРѕРѕР±С‰РµРЅРёСЏ': 'Сообщения',
    'Р”СЂСѓР·СЊСЏ': 'Друзья',
    'Р’РѕР»РЅС‹': 'Волны',
    'РњСѓР·С‹РєР°': 'Музыка',
    'РњРѕР№ РїСЂРѕС„РёР»СЊ': 'Мой профиль',
    'РџСЂРёР»РѕР¶РµРЅРёРµ': 'Приложение',
    'Р›РµРЅС‚Р°': 'Лента',
    'Р§Р°С‚С‹': 'Чаты',
    'Р—Р°СЏРІРєР° РІ РґСЂСѓР·СЊСЏ': 'Заявка в друзья',
    'С…РѕС‡РµС‚ РґРѕР±Р°РІРёС‚СЊ РІР°СЃ РІ РґСЂСѓР·СЊСЏ': 'хочет добавить вас в друзья',
    'РћС†РµРЅРёР» РІР°С€Сѓ Р’РѕР»РЅСѓ': 'Оценил вашу Волну',
    'РћСЃС‚Р°РІРёР» РєРѕРјРјРµРЅС‚Р°СЂРёР№': 'Оставил комментарий',
    'РЎРѕР±С‹С‚РёРµ РѕС‚': 'Событие от',
    'Р”СЂСѓРіР°': 'Друга',
    'Р’С‹Р№С‚Рё': 'Выйти',
    'в—Џ Online Signal': '● Online Signal',
    'РџРѕРёСЃРє РІ SETI': 'Поиск в SETI',
    'Р—Р°СЏРІРєРё РІ РґСЂСѓР·СЊСЏ': 'Заявки в друзья',
    'РќРµС‚ РЅРѕРІС‹С… Р·Р°СЏРІРѕРє': 'Нет новых заявок',
    'РЈРІРµРґРѕРјР»РµРЅРёСЏ': 'Уведомления',
    'РќРµС‚ РЅРѕРІС‹С… СЃРѕР±С‹С‚РёР№': 'Нет новых событий',
    'РѕС†РµРЅРёР» РІР°С€Сѓ Р’РѕР»РЅСѓ': 'оценил вашу Волну',
    'РїСЂРѕРєРѕРјРјРµРЅС‚РёСЂРѕРІР°Р» РІР°С€Сѓ Р’РѕР»РЅСѓ': 'прокомментировал вашу Волну',
    'РњРµРЅСЋ': 'Меню'
  };
  
  let newCode = code;
  let changed = false;
  for(let [k,v] of Object.entries(map)) {
    if (newCode.includes(k)) {
      newCode = newCode.split(k).join(v);
      changed = true;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, newCode, 'utf8');
    console.log('Fixed:', filePath);
  }
}

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            fixCorruptedCyrillic(fullPath);
        }
    }
}

// Since I am only confident about frontend/src being corrupted during development:
processDir(path.join(__dirname, 'frontend/src'));
