import { Component } from '@angular/core';
import { StateService } from '../state.service';

@Component({
  selector: 'app-object-list',
  templateUrl: './object-list.component.html',
  styleUrls: ['./object-list.component.css']
})
export class ObjectListComponent {
  objects: { name: string, value: number }[] = [];
  experts: { name: string, objects: { name: string, value: number }[], sortedObjects: { name: string, value: number }[], matrix: number[][] }[] = [];
  numExperts: number = 1;

  draft: string[] = [];
  protocol: string[] = [];
  draggedItemIndex: number | null = null;

  constructor(private stateService: StateService) { }

  ngOnInit() {
    this.objects = this.stateService.getObjects();
    this.protocol = JSON.parse(localStorage.getItem('protocol') || '[]');
    console.log(this.objects);

    const expertsData = this.stateService.getExpertsData();
    if (Object.keys(expertsData).length > 0) {
      // Якщо є збережені експерти, відновлюємо їх
      this.experts = Object.keys(expertsData).map((expertName) => ({
        name: expertName,
        objects: [...this.objects], // Відновлюємо об'єкти
        sortedObjects: [...this.objects].sort((a, b) => a.value - b.value), // Сортуємо
        matrix: expertsData[expertName] // Відновлюємо матрицю з StateService
      }));
      this.numExperts = this.experts.length; // Оновлюємо кількість експертів
    } else {
      // Якщо експертів немає, ініціалізуємо стандартних
      this.initializeExperts();
    }
  }

  // Метод для завантаження CSV-файлу
  onFileUpload(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const text = e.target.result;
      this.draft = text.split('\n').filter((line: string) => line.trim() !== '');
      // Записуємо значення з draft у objects, з індексом як value
      this.objects = this.draft.map((name: string, index: number) => ({
        name,
        value: index
      }));

      // Оновлюємо списки об'єктів та матриці для всіх експертів
      this.experts.forEach((expert, index) => {
        expert.objects = [...this.objects]; // Копіюємо новий глобальний список об'єктів
        expert.sortedObjects = [...expert.objects].sort((a, b) => a.value - b.value); // Сортуємо об'єкти
        expert.matrix = this.createEmptyMatrix(this.objects.length); // Оновлюємо матрицю
        this.updateMatrix(index); // Перераховуємо матрицю для кожного експерта
      });

      this.stateService.setObjects(this.objects);
      this.logAction('Завантажено файл');
    };

    reader.readAsText(file);
  }


  // Додавання нового об'єкта
  addObject(name: string) {
    const value = this.objects.length;
    const newObject = { name, value };
    this.objects.push(newObject);

    // Оновлюємо об'єкти у всіх експертів
    this.experts.forEach((expert, index) => {
      expert.objects.push(newObject);
      expert.sortedObjects = [...expert.objects].sort((a, b) => a.value - b.value);
      this.updateMatrix(index); // Оновлюємо матрицю для кожного експерта
    });

    this.stateService.setObjects(this.objects);
    this.logAction(`Додано об'єкт: ${name}`); 
    
  }
 

  // Видалення об'єкта
  removeObject(index: number) {
    if (index >= 0 && index < this.objects.length) {
      const removedObject = this.objects.splice(index, 1)[0];

      // Видаляємо об'єкт у всіх експертів
      this.experts.forEach((expert, expertIndex) => {
        expert.objects = expert.objects.filter(obj => obj.name !== removedObject.name);
        expert.sortedObjects = [...expert.objects].sort((a, b) => a.value - b.value);
        this.updateMatrix(expertIndex); // Оновлюємо матрицю для кожного експерта
      });

      this.stateService.setObjects(this.objects);
      this.logAction(`Видалено об'єкт: ${removedObject.name}`);
    }
  }

  // Логування дій
  logAction(action: string) {
    this.protocol.push(action);
    localStorage.setItem('protocol', JSON.stringify(this.protocol));
  }

  // Створення порожньої матриці
  createEmptyMatrix(size: number): number[][] {
    return Array(size).fill(0).map(() => Array(size).fill(0));
  }

  // Ініціалізація експертів
  initializeExperts() {
    this.experts = Array.from({ length: this.numExperts }, (_, i) => ({
      name: `Експерт ${i + 1}`,
      objects: [...this.objects],
      sortedObjects: [...this.objects].sort((a, b) => a.value - b.value),
      matrix: this.createEmptyMatrix(this.objects.length),
    }));
    // Синхронізуємо з StateService
    this.experts.forEach((expert) =>
      this.stateService.setComparisonMatrix(expert.name, expert.matrix)
    );
  }

  // Оновлення кількості експертів
  updateExpertsCount(count: number) {
    this.numExperts = count;

    if (count > this.experts.length) {
      for (let i = this.experts.length; i < count; i++) {
        this.experts.push({
          name: `Експерт ${i + 1}`,
          objects: [...this.objects],
          sortedObjects: [...this.objects].sort((a, b) => a.value - b.value),
          matrix: this.createEmptyMatrix(this.objects.length),
        });
      }
    } else {
      this.experts = this.experts.slice(0, count);
    }

    this.experts.forEach((expert) =>
      this.stateService.setComparisonMatrix(expert.name, expert.matrix)
    );
  }


  // Оновлення матриці попарних порівнянь
  updateMatrix(expertIndex: number) {
    const expert = this.experts[expertIndex];
    const size = expert.objects.length;

  // Сортуємо об'єкти для відображення в матриці за `value`
  expert.sortedObjects = [...expert.objects].sort((a, b) => a.value - b.value);

  // Створюємо нову матрицю
  const newMatrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));

  // Оновлюємо матрицю на основі індексів (рейтингу) об'єктів у списку
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      // Знаходимо об'єкти в `expert.objects`
      const objectI = expert.sortedObjects[i]; // Об'єкт із `value` для рядка
      const objectJ = expert.sortedObjects[j]; // Об'єкт із `value` для стовпця

      // Визначаємо індекси об'єктів у списку (рейтинги)
      const indexI = expert.objects.findIndex(obj => obj.name === objectI.name);
      const indexJ = expert.objects.findIndex(obj => obj.name === objectJ.name);

      // Попарні порівняння на основі рейтингу (індекса у списку)
      if (indexI > indexJ) {
        newMatrix[i][j] = -1; // Об'єкт I має нижчий рейтинг
      } else if (indexI < indexJ) {
        newMatrix[i][j] = 1;  // Об'єкт I має вищий рейтинг
      } else {
        newMatrix[i][j] = 0;  // Об'єкти рівні
      }
    }
  }

    expert.matrix = newMatrix;
    this.stateService.setComparisonMatrix(expert.name, newMatrix);
    this.logAction(`Матрицю оновлено для експерта: ${this.experts[expertIndex].name}`);
  }

  // Перетягування елемента (початок)
  onDragStart(expertIndex: number, index: number) {
    this.draggedItemIndex = index;
  }

  // Перетягування елемента (фіналізація)
  onDrop(expertIndex: number, index: number) {
    if (this.draggedItemIndex !== null && this.draggedItemIndex !== index) {
      const expert = this.experts[expertIndex];
      const draggedItem = expert.objects[this.draggedItemIndex];
  
      // Видаляємо об'єкт з початкової позиції та додаємо на нову позицію
      expert.objects.splice(this.draggedItemIndex, 1); // Видаляємо об'єкт
      expert.objects.splice(index, 0, draggedItem); // Додаємо об'єкт на нову позицію
  
      // Перераховуємо sortedObjects без зміни значення value
  
      this.logAction(`${expert.name} перетягнув "${draggedItem.name}" з позиції ${this.draggedItemIndex + 1} на ${index + 1}`);

      // Оновлюємо матрицю для конкретного експерта
      this.updateMatrix(expertIndex);
  
    }
  
    // Скидаємо перетягуваний індекс
    this.draggedItemIndex = null;
  
    console.log('Оновлений список об\'єктів:', this.experts[expertIndex].objects);
  }
  

  onDragOver(event: Event) {
    event.preventDefault();  // Дозволяємо drop
  }

  clearExperts() {
    this.experts = [];
    this.stateService.clearExperts();
    this.logAction('Експертів очищено');
  }

  createInitialMatrix(size: number): number[][] {
    const matrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        if (i > j) {
          matrix[i][j] = -1; // Якщо індекс об’єкта i більше за індекс об’єкта j
        } else if (i < j) {
          matrix[i][j] = 1;  // Якщо індекс об’єкта i менше за індекс об’єкта j
        } else {
          matrix[i][j] = 0;  // Якщо індекси рівні
        }
      }
    }
  
    return matrix;
  }

  // Додавання нового експерта
  addExpert() {
    const newExpertName = `Експерт ${this.experts.length + 1}`;
    const newExpert = {
      name: newExpertName,
      objects: [...this.objects], // Копіюємо поточний список об'єктів
      sortedObjects: [...this.objects].sort((a, b) => a.value - b.value), // Сортуємо за value
      matrix: this.createInitialMatrix(this.objects.length), // Створюємо початкову матрицю
    };
  
    // Додаємо експерта до списку
    this.experts.push(newExpert);
  
    // Зберігаємо експерта в StateService
    this.stateService.setComparisonMatrix(newExpertName, newExpert.matrix);
  
    // Логування
    this.logAction(`Додано експерта: ${newExpertName}`);
  }
  

// Видалення останнього експерта
removeExpert() {
  if (this.experts.length > 1) {
    const removedExpert = this.experts.pop(); // Видаляємо останнього експерта

    // Видаляємо дані експерта з StateService
    if (removedExpert) {
      this.stateService.removeExpert(removedExpert.name);
      this.logAction(`Видалено експерта: ${removedExpert.name}`);
    }
  } else {
    // Якщо експертів менше 1, просто логуємо спробу
    this.logAction('Спроба видалення останнього експерта заблокована');
  }
}


}
