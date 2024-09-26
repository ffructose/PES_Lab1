import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private objects: string[] = [];
  private comparisonMatrix: number[][] = [];

  // Метод для отримання об'єктів
  getObjects() {
    return this.objects;
  }

  // Метод для збереження об'єктів
  setObjects(objects: string[]) {
    this.objects = objects;
    localStorage.setItem('objects', JSON.stringify(this.objects));  // Зберігаємо в localStorage
  }

  // Метод для отримання матриці порівнянь
  getComparisonMatrix() {
    return this.comparisonMatrix;
  }

  // Метод для збереження матриці порівнянь
  setComparisonMatrix(matrix: number[][]) {
    this.comparisonMatrix = matrix;
    localStorage.setItem('comparisonMatrix', JSON.stringify(this.comparisonMatrix));  // Зберігаємо в localStorage
  }

  // Метод для завантаження протоколу з localStorage
  loadProtocolFromStorage() {
    const savedObjects = localStorage.getItem('objects');
    const savedMatrix = localStorage.getItem('comparisonMatrix');

    if (savedObjects) {
      this.objects = JSON.parse(savedObjects);
    }

    if (savedMatrix) {
      this.comparisonMatrix = JSON.parse(savedMatrix);
    }
  }
}
