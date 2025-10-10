import * as d3 from 'd3'
import 'd3-context-menu'
import 'd3-context-menu/css/d3-context-menu.css'

export function addContextMenu (node, options) {
  node.on('contextmenu', d3.contextMenu(options, {
    onClose: function (data, event) {
      console.log('Menu Closed!', 'element:', this, 'data:', data, 'event:', event, 'index:', index);
    }
  }))
}