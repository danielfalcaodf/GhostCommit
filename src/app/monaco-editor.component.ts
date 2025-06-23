import { Component, Input, OnInit, OnDestroy, forwardRef, ElementRef, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

declare const monaco: any;
declare const require: any;

@Component({
  selector: 'app-monaco-editor',
  templateUrl: './monaco-editor.component.html',
  styleUrls: ['./monaco-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MonacoEditorComponent),
      multi: true
    }
  ]
})
export class MonacoEditorComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  
  @Input() options: any = {
    theme: 'vs-dark',
    language: 'javascript',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    fontSize: 14,
    wordWrap: 'on'
  };

  private editor?: any;
  private value = '';
  
  // ControlValueAccessor
  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.initEditor();
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  private initEditor() {
    if (!this.editorContainer || typeof require === 'undefined') {
      console.error('Monaco Editor loader not available');
      return;
    }

    require.config({ paths: { 'vs': 'https://unpkg.com/monaco-editor@0.52.2/min/vs' }});
    
    require(['vs/editor/editor.main'], () => {
      this.editor = monaco.editor.create(this.editorContainer.nativeElement, {
        ...this.options,
        value: this.value
      });

      // Listen for content changes
      this.editor.onDidChangeModelContent(() => {
        const value = this.editor?.getValue() || '';
        this.value = value;
        this.onChange(value);
      });

      // Listen for blur events
      this.editor.onDidBlurEditorText(() => {
        this.onTouched();
      });
    });
  }

  // ControlValueAccessor implementation
  writeValue(value: string): void {
    this.value = value || '';
    if (this.editor) {
      this.editor.setValue(this.value);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    if (this.editor) {
      this.editor.updateOptions({ readOnly: isDisabled });
    }
  }
}
