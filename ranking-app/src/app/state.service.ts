import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private objects: { name: string, value: number }[] = [];
  private expertsData: { [key: string]: number[][] } = {}; // Зберігаємо матриці для кожного експерта

  // Метод для отримання об'єктів
  getObjects() {
    const savedObjects = localStorage.getItem('objects');
    if (savedObjects) {
      this.objects = JSON.parse(savedObjects);
    }
    return this.objects;
  }
  

  // Метод для збереження об'єктів
  setObjects(objects: { name: string, value: number }[]) {
    this.objects = objects;
    localStorage.setItem('objects', JSON.stringify(this.objects));  // Зберігаємо в localStorage
  }

  // Метод для отримання матриці порівнянь для конкретного експерта
  getComparisonMatrix(expertName: string): number[][] {
    if (!this.expertsData[expertName]) {
      return [];
    }
    return this.expertsData[expertName];
  }
  

  // Метод для збереження матриці порівнянь для конкретного експерта
  setComparisonMatrix(expertName: string, matrix: number[][]) {
    if (!this.expertsData) {
      this.expertsData = {};
    }
  
    // Зберігаємо матрицю для конкретного експерта
    this.expertsData[expertName] = matrix;
  
    // Оновлюємо локальне сховище
    localStorage.setItem('expertsData', JSON.stringify(this.expertsData));
  }

  // Ініціалізація експертів
  initializeExperts(expertNames: string[]) {
    expertNames.forEach(name => {
      if (!this.expertsData[name]) {
        this.expertsData[name] = this.createEmptyMatrix(this.objects.length);
      }
    });
    localStorage.setItem('expertsData', JSON.stringify(this.expertsData));
  }

  // Видалення експерта
  removeExpert(expertName: string) {
    delete this.expertsData[expertName];
    localStorage.setItem('expertsData', JSON.stringify(this.expertsData));
  }

  // Метод для створення порожньої матриці
  private createEmptyMatrix(size: number): number[][] {
    return Array(size).fill(0).map(() => Array(size).fill(0));
  }

  // Метод для завантаження протоколу з localStorage
  loadProtocolFromStorage() {
    const savedObjects = localStorage.getItem('objects');
    const savedExpertsData  = localStorage.getItem('expertsData');

    if (savedObjects) {
      this.objects = JSON.parse(savedObjects);
    }

    if (savedExpertsData) {
      this.expertsData = JSON.parse(savedExpertsData);
    }
  }

  getExpertsData(): { [key: string]: number[][] } {
    return this.expertsData;
  }

  clearExperts() {
    this.expertsData = {};
    localStorage.removeItem('expertsData');
  }
  updateExpertsData(experts: { name: string, matrix: number[][] }[]) {
    experts.forEach((expert) => {
      this.setComparisonMatrix(expert.name, expert.matrix);
    });
  }
  
}
