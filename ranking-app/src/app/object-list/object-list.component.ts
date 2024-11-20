import { Component } from '@angular/core';
import { StateService } from '../state.service';

@Component({
  selector: 'app-object-list',
  templateUrl: './object-list.component.html',
  styleUrls: ['./object-list.component.css']
})
export class ObjectListComponent {
  objects: { name: string, value: number }[] = [];
  allPossibleObjects: { objects: { name: string, value: number }[] }[] = [];
  cookDistances: {
    exp: {
      numVect: { value: number }[], // Вектор значень об'єктів
      sum: number // Сума відстаней для експерта
    }[]
  }[] = [];

  experts: { name: string, objects: { name: string, value: number }[], sortedObjects: { name: string, value: number }[], matrix: number[][] }[] = [];
  numExperts: number = 1;

  draft: string[] = [];
  protocol: string[] = [];
  draggedItemIndex: number | null = null;

  constructor(private stateService: StateService) { }

  ngOnInit() {
    this.objects = this.stateService.getObjects().map((obj, index) => ({
      ...obj,
      value: index + 1 // Починаємо value з 1
    }));
    this.protocol = JSON.parse(localStorage.getItem('protocol') || '[]');
    console.log(this.objects);
    this.generateAllPermutationsForObjects();
  
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
    this.lab3();
  }
  
  // Метод для завантаження CSV-файлу
  onFileUpload(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const text = e.target.result;
      this.draft = text.split('\n').filter((line: string) => line.trim() !== '');

      // Оновлюємо глобальний список об'єктів
      this.objects = this.draft.map((name: string, index: number) => ({
        name: name.trim(),
        value: index +1
      }));

      // Оновлюємо списки об'єктів, сортування та матриці для всіх експертів
      this.experts.forEach((expert, index) => {
        expert.objects = [...this.objects]; // Замінюємо список об'єктів для експерта
        expert.sortedObjects = [...expert.objects].sort((a, b) => a.value - b.value); // Сортуємо об'єкти
        expert.matrix = this.createEmptyMatrix(this.objects.length); // Створюємо нову матрицю
        this.updateMatrix(index); // Оновлюємо матрицю для експерта
      });

      // Зберігаємо оновлений список об'єктів у StateService
      this.stateService.setObjects(this.objects);

      // Логування дії
      this.logAction('Завантажено новий файл, список об’єктів оновлено.');
    };

    reader.readAsText(file);
  }

  // Додавання нового об'єкта
  addObject(name: string) {
    const value = this.objects.length+1;
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
    this.generateAllPermutationsForObjects();
  }


  // Видалення об'єкта
  removeObject(index: number, expertIndex: number) {
    const expert = this.experts[expertIndex];

    // Отримуємо ім'я об'єкта, який потрібно видалити
    const removedObjectName = expert.objects[index].name;

    // Видаляємо об'єкт із глобального списку (якщо він є)
    this.objects = this.objects.filter(obj => obj.name !== removedObjectName);

    // Видаляємо об'єкт у всіх експертів за ім'ям
    this.experts.forEach((exp) => {
      exp.objects = exp.objects.filter(obj => obj.name !== removedObjectName);
      exp.sortedObjects = [...exp.objects].sort((a, b) => a.value - b.value); // Оновлюємо sortedObjects
    });

    // Оновлюємо матриці для всіх експертів
    this.experts.forEach((_, index) => this.updateMatrix(index));

    // Зберігаємо зміни
    this.stateService.setObjects(this.objects);
    this.generateAllPermutationsForObjects();

    // Логування
    this.logAction(`Видалено об'єкт: ${removedObjectName}`);
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
 
    this.lab3();
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

  lab3() {
    this.generateAllPermutationsForObjects();
    this.cookDistance();
  }

  //1. я створюю для кожного відранжованого експертом списку -
  // вектор якийсь там типу яку позицію займає обєкт в 
  // ранговому списку кожного експерта.

  // в мене цей вектор вже є, значення валью в обєкті

  //2. створюю масив де є всі можливі варіанти перестановок обєктів.
  generateAllPermutationsForObjects() {
    const results: { objects: { name: string, value: number }[] }[] = [];
  
    const permute = (arr: { name: string, value: number }[], m: { name: string, value: number }[] = []) => {
      if (arr.length === 0) {
        results.push({ objects: [...m] }); // Додаємо одну з перестановок
      } else {
        for (let i = 0; i < arr.length; i++) {
          const current = arr.slice();
          const next = current.splice(i, 1);
          permute(current.slice(), m.concat(next));
        }
      }
    };
  
    permute(this.objects);
  
    // Унікалізуємо результати
    const uniqueResults = results.filter(
      (result, index, self) =>
        index === self.findIndex((r) => JSON.stringify(r) === JSON.stringify(result))
    );
  
    // Упевнюємося, що початковий список не дублюється
    this.allPossibleObjects = uniqueResults.filter(
      (result) =>
        JSON.stringify(result.objects) !== JSON.stringify(this.objects)
    );
  
    // Додаємо початковий список об'єктів на перше місце
    this.allPossibleObjects.unshift({ objects: [...this.objects] });
  }
  

  //3. Для кожного експерта знаходжу оцю відстань кука 
  // на основі всіх можливих варіантів і створеного в 1му пункті вектора.
  cookDistance() {
    // Очищуємо поточний масив cookDistances
    this.cookDistances = [];
  
    // Проходимося по всіх експертах
    this.experts.forEach((expert) => {
      const expData: { numVect: { value: number }[], sum: number }[] = [];
  
      // Проходимося по всіх перестановок об'єктів у allPossibleObjects
      this.allPossibleObjects.forEach((permutation) => {
        const numVect = permutation.objects.map((object, index) => {
          const expertValue = expert.objects[index].value; // Беремо value з об'єкта експерта
          const distance = Math.abs(object.value - expertValue); // Розрахунок |value - value експерта|
          return { value: distance };
        });
  
        // Підраховуємо суму елементів у numVect
        const sum = numVect.reduce((acc, item) => acc + item.value, 0);
  
        // Додаємо дані про одну перестановку до експерта
        expData.push({ numVect, sum });
      });
  
      // Додаємо дані про експерта до cookDistances
      this.cookDistances.push({ exp: expData });
    });
  
    console.log('Cook Distances:', this.cookDistances);
  }


  //4. Для матриці ПП кожного експерта роблю вектор враховуючи лише 
  // верхню праву частину якоїсь там скісної матриці. довжина має бути n*(N-1)/2



  //5. знаходжу відстань хеммінга?
}