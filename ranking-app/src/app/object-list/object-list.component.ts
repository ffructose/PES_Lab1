import { Component, OnInit } from '@angular/core';
import { StateService } from '../state.service';

@Component({
  selector: 'app-object-list',
  templateUrl: './object-list.component.html',
  styleUrls: ['./object-list.component.css']
})
export class ObjectListComponent implements OnInit {
  objects: string[] = [];
  comparisonMatrix: number[][] = [];
  protocol: string[] = [];
  draggedItemIndex: number | null = null;

  constructor(private stateService: StateService) {}

  ngOnInit() {
    this.objects = this.stateService.getObjects();
    this.comparisonMatrix = this.stateService.getComparisonMatrix();
    this.protocol = JSON.parse(localStorage.getItem('protocol') || '[]');
  }

  // Додавання нового об'єкта
  addObject(newObject: string) {
    this.objects.push(newObject);
    this.stateService.setObjects(this.objects);
    this.updateMatrix();
    this.logAction(`Додано новий об'єкт: ${newObject}`);
  }

  // Видалення об'єкта
  removeObject(index: number) {
    const removedObject = this.objects.splice(index, 1);
    this.stateService.setObjects(this.objects);
    this.updateMatrix();
    this.logAction(`Видалено об'єкт: ${removedObject}`);
  }

  // Логування дій
  logAction(action: string) {
    this.protocol.push(action);
    localStorage.setItem('protocol', JSON.stringify(this.protocol));
  }

  // Оновлення матриці попарних порівнянь
  updateMatrix() {
    const size = this.objects.length;
    const newMatrix: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        newMatrix[i][j] = i < j ? 1 : 0;
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
      const draggedItem = this.objects[this.draggedItemIndex];
      this.objects.splice(this.draggedItemIndex, 1);
      this.objects.splice(index, 0, draggedItem);
      this.stateService.setObjects(this.objects);
      this.updateMatrix();
      this.logAction(`Перетягнуто об'єкт з позиції ${this.draggedItemIndex + 1} на ${index + 1}`);
    }
    this.draggedItemIndex = null;
  }

  onDragOver(event: Event) {
    event.preventDefault();  // Дозволяємо drop
  }
}
