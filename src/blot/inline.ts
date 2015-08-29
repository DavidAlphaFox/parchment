import Blot from './blot';
import LeafBlot from './leaf';
import ParentBlot from './parent';
import * as Registry from '../registry';
import { ShadowParent } from './shadow';
import LinkedList from '../collection/linked-list';
import * as util from '../util';


class InlineBlot extends ParentBlot {
  static blotName = 'inline';
  static tagName = 'SPAN';

  children: LinkedList<InlineBlot | LeafBlot> = new LinkedList<InlineBlot | LeafBlot>();

  static compare = function(thisName: string, otherName: string): boolean {
    return thisName <= otherName;
  }

  format(name: string, value: any): void {
    super.format(name, value);
    if (Object.keys(this.getFormat()).length === 0) {
      this.unwrap();
    }
  }

  formatAt(index: number, length: number, name: string, value: any): void {
    if (Registry.match(name, Registry.Type.ATTRIBUTE) ||
        InlineBlot.compare(this.statics.blotName, name)) {
      var formats = this.getFormat();
      if (value && formats[name] === value) return;
      if (!value && !formats[name]) return;
      let target = <Blot>this.isolate(index, length);
      target.format(name, value);
    } else {
      super.formatAt(index, length, name, value);
    }
  }

  getFormat() {
    var formats = super.getFormat();
    if (this.statics.blotName !== InlineBlot.blotName) {
      formats[this.statics.blotName] = true;
    }
    return formats;
  }

  merge(target: Blot = this.next): boolean {
    if (!this.parent) return false;
    if (target != null &&
        this.statics.blotName === target.statics.blotName &&
        util.isEqual(target.getFormat(), this.getFormat())) {
      var nextTarget = this.children.tail;
      (<ParentBlot>target).moveChildren(this);
      target.remove();
      nextTarget.merge();
      return true;
    }
    return false;
  }

  unwrap(): void {
    if (Object.keys(this.attributes).length) {
      this.replace(InlineBlot.blotName, true);
    } else {
      super.unwrap();
    }
  }

  wrap(name: string, value: any): ParentBlot {
    if (name === this.statics.blotName) {
      if (this.getFormat()[name] == value) {
        return this;
      } else {
        return this.replace(name, value);
      }
    } else if (this.statics.blotName === InlineBlot.blotName) {
      return this.replace(name, value);
    } else {
      let wrapper = <ParentBlot>super.wrap(name, value);
      this.moveAttributes(wrapper);
      return wrapper;
    }
  }
}


export default InlineBlot;