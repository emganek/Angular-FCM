import { CdkDragDrop, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Task } from './task/task';
import { MatDialog } from '@angular/material/dialog';
import {
  TaskDialogComponent,
  TaskDialogResult,
} from './task-dialog/task-dialog.component';
import {
  Firestore,
  deleteDoc,
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
  runTransaction,
} from '@angular/fire/firestore';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { getMessaging, getToken, onMessage } from '@angular/fire/messaging';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit, OnDestroy {
  COLLECTION_NAME = {
    todo: 'todo',
    inProgress: 'inProgress',
    done: 'done',
  };
  todo: Task[] = [];
  inProgress: Task[] = [];
  done: Task[] = [];
  todoSnapshot: any;
  inProgressSnapshot: any;
  doneSnapshot: any;
  todoCollection: any;
  inProgressCollection: any;
  doneCollection: any;
  title = 'af-notification';
  message: any = null;
  fcmToken!: string;

  constructor(
    private dialog: MatDialog,
    private store: Firestore,
    private analytics: Analytics
  ) {
    this.todoCollection = collection(store, this.COLLECTION_NAME.todo);
    this.inProgressCollection = collection(
      store,
      this.COLLECTION_NAME.inProgress
    );
    this.doneCollection = collection(store, this.COLLECTION_NAME.done);
  }

  ngOnInit(): void {
    this.listenToFireBase();
    this.requestPermission();
    this.listenMessage();
  }

  async addToFireBase(collection: string, newTask: Task) {
    switch (collection) {
      case this.COLLECTION_NAME.todo:
        await addDoc(this.todoCollection, newTask);
        break;
      case this.COLLECTION_NAME.inProgress:
        await addDoc(this.inProgressCollection, newTask);
        break;
      case this.COLLECTION_NAME.done:
        await addDoc(this.doneCollection, newTask);
        break;
      default:
        break;
    }
  }

  listenToFireBase() {
    this.todoSnapshot = onSnapshot(this.todoCollection, (docSnapshot: any) => {
      this.todo = [];
      docSnapshot.forEach(
        (ele: any) =>
          (this.todo = [...this.todo, { ...ele.data(), id: ele.id }])
      );
    });
    this.inProgressSnapshot = onSnapshot(
      this.inProgressCollection,
      (docSnapshot: any) => {
        this.inProgress = [];
        docSnapshot.forEach(
          (ele: any) =>
            (this.inProgress = [
              ...this.inProgress,
              { ...ele.data(), id: ele.id },
            ])
        );
      }
    );
    this.doneSnapshot = onSnapshot(this.doneCollection, (docSnapshot: any) => {
      this.done = [];
      docSnapshot.forEach(
        (ele: any) =>
          (this.done = [...this.done, { ...ele.data(), id: ele.id }])
      );
    });
  }

  removeFromFireBase(collection: string, taskId: string | undefined) {
    if (taskId) {
      const docRef = doc(this.store, collection, taskId);
      deleteDoc(docRef);
    }
  }

  updateFireBase(collection: string, taskId: string | undefined, task: any) {
    if (taskId) {
      const docRef = doc(this.store, collection, taskId);
      updateDoc(docRef, task);
    }
  }

  newTask(): void {
    logEvent(this.analytics, 'add_new_task', {
      location: 'home page',
      action: 'click on plus icon',
      my_firebase_ga:"development"
    });
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {},
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        // this.todo.push(result.task);
        this.addToFireBase(this.COLLECTION_NAME.todo, result.task);
      });
  }

  editTask(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true,
      },
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult | undefined) => {
        if (!result) {
          return;
        }
        const dataList = this[list];
        const taskIndex = dataList.indexOf(task);
        if (result.delete) {
          this.removeFromFireBase(list, dataList[taskIndex].id);
          dataList.splice(taskIndex, 1);
        } else {
          dataList[taskIndex] = task;
          this.updateFireBase(list, dataList[taskIndex].id, task);
        }
      });
  }

  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      return;
    }
    if (!event.container.data || !event.previousContainer.data) {
      return;
    }
    const item = event.previousContainer.data[event.previousIndex];
    runTransaction(this.store, () => {
      const promise = Promise.all([
        this.addToFireBase(event.container.id, item),
        this.removeFromFireBase(event.previousContainer.id, item.id),
      ]);
      return promise;
    });

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }

  requestPermission() {
    const messaging = getMessaging();
    getToken(messaging, { vapidKey: environment.firebase.vapidKey })
      .then((currentToken) => {
        if (currentToken) {
          const tokenCollection = collection(this.store, 'FcmToken');
          addDoc(tokenCollection, { token: currentToken });
          console.log('Hurraaa!!! we got the token.....');
          console.log(currentToken);
          this.fcmToken = currentToken;
        } else {
          console.log(
            'No registration token available. Request permission to generate one.'
          );
        }
      })
      .catch((err) => {
        console.log('An error occurred while retrieving token. ', err);
      });
  }

  listenMessage() {
    console.log('start listenninggggggggggggggggggggg');
    const messaging = getMessaging();
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      this.message = payload;
    });
  }

  ngOnDestroy(): void {
    this.todoSnapshot();
    this.inProgressSnapshot();
    this.doneSnapshot();
  }
}
