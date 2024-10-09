import { createReaderSlug, itemIdFromSlug } from './intMaskSlug';

describe('ID Utils', () => {
  afterAll(() => {
    jest.clearAllMocks();
  });

  it('generates slugs', () => {
    expect(createReaderSlug('123')).toBe(
      'fe562f9c5BCfC1eeQ9AffKeCaiD2a190J7eb5D66B8DccAd6E6a1f247B54Egd22_202cb962ac59075b964b07152d234b70',
    );
    expect(createReaderSlug('1234')).toBe(
      'aaf10ce4cCDbD6aXWaBgcQdD57Ee24bcKb5ahJ3aC7E6fB2bA3ff05avCq2Aeb6a_81dc9bdb52d04dc20036dbd8313ed055',
    );

    expect(createReaderSlug('1233454')).toBe(
      '2186f4a18DTfE024XdH71b1E78A2db32VbT44P17N5A0eCecBbag5341Df0B5788_047ea2107743674078d60a939d5b1da2',
    );
    expect(createReaderSlug('11112342323')).toBe(
      '1fcq7b8aaCXcD2ebR2Lb8LhIagEaaaadPaOb0Od0RdJ64B54Fc3d1f98H70A78d6_468ebb364f349ce7428161da948a2202',
    );
  });

  it('validates ids', () => {
    expect(
      itemIdFromSlug(
        'aaf10ce4cCDbD6aXWaBgcQdD57Ee24bcKb5ahJ3aC7E6fB2bA3ff05avCq2Aeb6a_81dc9bdb52d04dc20036dbd8313ed055',
      ),
    ).toBe('1234');
    expect(
      itemIdFromSlug(
        '2186f4a18DTfE024XdH71b1E78A2db32VbT44P17N5A0eCecBbag5341Df0B5788_047ea2107743674078d60a939d5b1da2',
      ),
    ).toBe('1233454');
  });

  it('fails id validation', () => {
    expect(
      itemIdFromSlug(
        'aaf10ce4cCDbD6aXWaBgcQdD57E24bcKb5ahJ3aC7E6fB2bA3ff05avCq2Aeb6a_81dc9bdb52d04dc20036dbd8313ed5',
      ),
    ).toBeNull();
  });

  it('fails id validation when you cant split', () => {
    expect(
      itemIdFromSlug(
        'aaf10ce4cCDbD6aXWaBgcQdD57E24bcKb5ahJ3aC7E6fB2bA3ff05avCq2Aeb6a81dc9bdb52d04dc20036dbd8313ed5',
      ),
    ).toBeNull();
  });
});
