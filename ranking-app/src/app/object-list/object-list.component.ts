import { Component } from '@angular/core';
import { StateService } from '../state.service';

@Component({
  selector: 'app-object-list',
  templateUrl: './object-list.component.html',
  styleUrls: ['./object-list.component.css']
})
export class ObjectListComponent {
  objects: { name: string, value: number }[] = [];
  draft: string[] = [];
  comparisonMatrix: number[][] = [];
  protocol: string[] = [];
  draggedItemIndex: number | null = null;
  sortedObjects: { name: string, value: number }[] = [];

  constructor(private stateService: StateService) { }

  ngOnInit() {
    this.objects = this.stateService.getObjects();
    this.comparisonMatrix = this.stateService.getComparisonMatrix();
    this.protocol = JSON.parse(localStorage.getItem('protocol') || '[]');
    this.updateMatrix(); // Додаємо виклик тут
    console.log(this.objects);
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

      this.updateMatrix();
      this.stateService.setObjects(this.objects);
      this.logAction('Завантажено файл');
    };

    reader.readAsText(file);
  }


  // Додавання нового об'єкта
  addObject(name: string) {
    const value = this.objects.length; // Встановлюємо значення як індекс (довжина масиву перед додаванням)
    const newObject = { name, value };
    this.objects.push(newObject);
    this.stateService.setObjects(this.objects);
    this.updateMatrix();
    this.logAction(`Додано об'єкт: ${name} із значенням ${value}`);
  }

  // Видалення об'єкта
  removeObject(index: number) {
    if (index >= 0 && index < this.objects.length) {
      const removedObject = this.objects.splice(index, 1)[0]; // Видаляємо об'єкт за індексом

      // Оновлюємо sortedObjects і матрицю після видалення
      this.stateService.setObjects(this.objects);
      this.updateMatrix();
      this.logAction(`Видалено об'єкт: ${removedObject.name} із значенням ${removedObject.value}`);
    }
  }

  // Логування дій
  logAction(action: string) {
    this.protocol.push(action);
    localStorage.setItem('protocol', JSON.stringify(this.protocol));
  }

  // Оновлення матриці попарних порівнянь
  updateMatrix() {
    const size = this.objects.length;

    // Копіюємо та сортуємо об'єкти за значенням `value`
    this.sortedObjects = [...this.objects].sort((a, b) => a.value - b.value);
    const newMatrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));

    // Створюємо матрицю порівняння на основі початкових індексів
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const originalIndexI = this.objects.indexOf(this.sortedObjects[i]);
        const originalIndexJ = this.objects.indexOf(this.sortedObjects[j]);

        if (originalIndexI > originalIndexJ) {
          newMatrix[i][j] = -1; // Якщо індекс об'єкта i більше, ніж індекс об'єкта j
        } else if (originalIndexI < originalIndexJ) {
          newMatrix[i][j] = 1;  // Якщо індекс об'єкта i менше, ніж індекс об'єкта j
        } else {
          newMatrix[i][j] = 0;  // Якщо індекси рівні
        }
      }
    }

    this.comparisonMatrix = newMatrix;
    this.stateService.setComparisonMatrix(this.comparisonMatrix);
    this.logAction('Матрицю оновлено');
  }

  // Перетягування елемента (початок)
  onDragStart(index: number) {
    this.draggedItemIndex = index;
  }

  // Перетягування елемента (фіналізація)
  onDrop(index: number) {
    if (this.draggedItemIndex !== null && this.draggedItemIndex !== index) {
      // Зберігаємо об'єкт, який перетягується
      const draggedItem = this.objects[this.draggedItemIndex];

      // Видаляємо об'єкт із поточної позиції
      this.objects.splice(this.draggedItemIndex, 1);
      // Вставляємо об'єкт на нову позицію
      this.objects.splice(index, 0, draggedItem);

      // Після зміни порядку індекси оновлюються автоматично

      this.stateService.setObjects(this.objects);
      this.updateMatrix();
      this.logAction(`Перетягнуто "${draggedItem.name}" з позиції ${this.draggedItemIndex + 1} на ${index + 1}`);
    }
    this.draggedItemIndex = null;
    console.log(this.objects);
  }

  onDragOver(event: Event) {
    event.preventDefault();  // Дозволяємо drop
  }
}
