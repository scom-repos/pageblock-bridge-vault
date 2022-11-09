import { Styles } from '@ijstech/components';

Styles.cssRule('.staking-manage-stake', {
  $nest: {
    'input': {
      $nest: {
        '&::-webkit-outer-spin-button': {
          '-webkit-appearance': 'none',
          margin: '0',
        },
        '&::-webkit-inner-spin-button': {
          '-webkit-appearance': 'none',
          margin: '0',
        },
      }
    },
    '.staking-token-input > input': {
      border: 'none',
      width: '100% !important',
      height: '100% !important',
      backgroundColor: 'transparent',
      color: '#fff',
      fontSize: '1rem',
      textAlign: 'left',
      paddingInline: 8,
    },
  }
})