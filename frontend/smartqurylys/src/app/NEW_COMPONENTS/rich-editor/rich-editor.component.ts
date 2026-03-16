import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AfterViewInit,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Editor } from '@tiptap/core';
import { Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
@Component({
  selector: 'app-rich-editor',
  standalone: true,
  imports: [],
  templateUrl: './rich-editor.component.html',
  styleUrl: './rich-editor.component.css'
})
export class RichEditorComponent implements AfterViewInit, OnDestroy {
  @Input({ required: false }) projectDescriptionHTML: string = ''
  @Output() onClickEditorSaveEvent = new EventEmitter<string>()
  @Output() onClickEditorCancelEvent = new EventEmitter<void>()

  @ViewChild('editorHost', { static: true })
  editorHost!: ElementRef<HTMLDivElement>;

  editor: Editor | null = null;
  htmlContent = '<p></p>';

  ngAfterViewInit(): void {
    this.editor = new Editor({
      content: this.htmlContent,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
          link: {
            openOnClick: false,
          },
        }),
        Placeholder.configure({
          placeholder: 'Введите описание...',
        }),
      ],
      editorProps: {
        attributes: {
          class: 'tiptap editor-content',
        },
      },
      onUpdate: ({ editor }) => {
        this.htmlContent = editor.getHTML();
      },
    });

    this.editor.mount(this.editorHost.nativeElement);
    this.editor.commands.setContent(this.projectDescriptionHTML)
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  focusEditor(): void {
    this.editor?.commands.focus();
  }

  toggleBold(): void {
    this.editor?.chain().focus().toggleBold().run();
  }

  toggleItalic(): void {
    this.editor?.chain().focus().toggleItalic().run();
  }

  toggleUnderline(): void {
    this.editor?.chain().focus().toggleUnderline().run();
  }

  toggleStrike(): void {
    this.editor?.chain().focus().toggleStrike().run();
  }

  toggleH1(): void {
    this.editor?.chain().focus().toggleHeading({ level: 1 }).run();
  }

  toggleH2(): void {
    this.editor?.chain().focus().toggleHeading({ level: 2 }).run();
  }

  toggleBulletList(): void {
    this.editor?.chain().focus().toggleBulletList().run();
  }

  toggleOrderedList(): void {
    this.editor?.chain().focus().toggleOrderedList().run();
  }

  toggleBlockquote(): void {
    this.editor?.chain().focus().toggleBlockquote().run();
  }

  undo(): void {
    this.editor?.chain().focus().undo().run();
  }

  redo(): void {
    this.editor?.chain().focus().redo().run();
  }

  setLink(): void {
    if (!this.editor) return;

    const currentHref = this.editor.getAttributes('link')['href'] ?? '';
    const url = window.prompt('Введите ссылку', currentHref);

    if (url === null) return;

    if (url.trim() === '') {
      this.editor.chain().focus().unsetLink().run();
      return;
    }

    this.editor.chain().focus().setLink({ href: url }).run();
  }

  onEditorCancelClick() {
    if (!this.editor) return;
    this.editor?.commands.setContent(this.projectDescriptionHTML)
    this.htmlContent = this.projectDescriptionHTML || '<p></p>';
    this.onClickEditorCancelEvent.emit()
  }

  onEditorSaveClick() {
    if (!this.editor) return;
    this.onClickEditorSaveEvent.emit(this.htmlContent)
  }
}
