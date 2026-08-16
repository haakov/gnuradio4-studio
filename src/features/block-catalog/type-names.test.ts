import { describe, expect, it } from 'vitest';
import { abbreviateTypeExpr, abbreviateTypeName } from './type-names';

describe('type name abbreviations', () => {
  it('abbreviates the reflected primitive spellings', () => {
    expect(abbreviateTypeName('uint8')).toBe('ui8');
    expect(abbreviateTypeName('uint8_t')).toBe('ui8');
    expect(abbreviateTypeName('std::uint8_t')).toBe('ui8');
    expect(abbreviateTypeName('int32')).toBe('i32');
    expect(abbreviateTypeName('float32')).toBe('f32');
    expect(abbreviateTypeName('float')).toBe('f32');
    expect(abbreviateTypeName('double')).toBe('f64');
    expect(abbreviateTypeName('unsigned char')).toBe('ui8');
    expect(abbreviateTypeName('std::string')).toBe('str');
  });

  it('keeps unknown type names, minus their namespaces', () => {
    expect(abbreviateTypeName('gr::trigger::BasicTriggerNameCtxMatcher')).toBe(
      'BasicTriggerNameCtxMatcher',
    );
    expect(abbreviateTypeName('bool')).toBe('bool');
    expect(abbreviateTypeName('true')).toBe('true');
    expect(abbreviateTypeName('size_t')).toBe('usz');
  });

  it('abbreviates nested template arguments', () => {
    expect(abbreviateTypeExpr('complex<float64>')).toBe('c<f64>');
    expect(abbreviateTypeExpr('std::complex<float32>')).toBe('c<f32>');
    expect(abbreviateTypeExpr('pmtcomplex<float32>')).toBe('c<f32>');
    expect(abbreviateTypeExpr('gr::DataSet<float32>')).toBe('DataSet<f32>');
    expect(abbreviateTypeExpr('std::vector<std::complex<double>>')).toBe('vec<c<f64>>');
    expect(abbreviateTypeExpr('std::chrono::nanoseconds')).toBe('ns');
  });

  it('expands numpy-style complex aliases to the templated spelling', () => {
    expect(abbreviateTypeExpr('complex64')).toBe('c<f32>');
    expect(abbreviateTypeExpr('complex128')).toBe('c<f64>');
  });
});
