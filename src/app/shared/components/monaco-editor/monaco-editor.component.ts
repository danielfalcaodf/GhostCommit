import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, forwardRef, ElementRef, ViewChild } from '@angular/core';
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
export class MonacoEditorComponent implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  
  @Input() language = 'javascript';
  @Input() theme = 'vs-dark';
  @Input() code = '';
  @Input() options: any = {};
  
  @Output() codeChange = new EventEmitter<string>();
  
  private editor?: any;
  private value = '';
  
  // ControlValueAccessor
  private onChange = (value: string) => {};
  private onTouched = () => {};

  private get editorOptions() {
    return {
      theme: this.theme,
      language: this.language,
      automaticLayout: true,
      scrollBeyondLastLine: false,
      fontSize: 14,
      wordWrap: 'on',
      ...this.options
    };
  }

  ngOnInit() {
    this.value = this.code;
    this.initEditor();
  }

  ngOnDestroy() {
    if (this.editor) {
      this.editor.dispose();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['code'] && this.editor && changes['code'].currentValue !== this.value) {
      this.value = changes['code'].currentValue || '';
      this.editor.setValue(this.value);
    }
    
    if (changes['language'] && this.editor) {
      const model = this.editor.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, this.language);
      }
    }
    
    if (changes['theme'] && this.editor) {
      monaco.editor.setTheme(this.theme);
    }
    
    if (changes['options'] && this.editor) {
      this.editor.updateOptions(this.editorOptions);
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
        ...this.editorOptions,
        value: this.value
      });

      // Listen for content changes
      this.editor.onDidChangeModelContent(() => {
        const value = this.editor?.getValue() || '';
        this.value = value;
        this.onChange(value);
        this.codeChange.emit(value);
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
